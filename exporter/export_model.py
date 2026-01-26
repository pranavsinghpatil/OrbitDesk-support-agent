import torch
import numpy as np
import json
import os
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Configuration
MODEL_NAME = 'gpt2'
OUTPUT_DIR = 'data_export'
PROMPT = "The quick brown fox"

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

class ModelExporter:
    def __init__(self, model_name=MODEL_NAME):
        print(f"Loading {model_name}...")
        self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
        self.model = GPT2LMHeadModel.from_pretrained(model_name)
        self.model.eval()
        self.activations = {}
        self.hooks = []

    def register_hooks(self):
        print("Registering hooks...")
        
        def getStringId(module):
            # Helper to generate a somewhat unique ID for the module
            # In a real app we might traverse the graph to get "h.0.attn"
            return str(module)

        # We need to map modules to names
        self.named_modules = dict(self.model.named_modules())
        
        for name, module in self.named_modules.items():
            # We are interested in specific layers
            if isinstance(module, (torch.nn.Linear, torch.nn.LayerNorm, torch.nn.Embedding)):
                # Hook for activations (output of layer)
                hook = module.register_forward_hook(
                    lambda m, inp, out, n=name: self.save_activation(n, out)
                )
                self.hooks.append(hook)
                
            # Special case for Attention: we often want the attention weights (QK^T)
            # GPT2Attention returns outputs, but we might need to verify if we can get attention scores.
            # Transformers GPT2 output_attentions=True does this cleanly without hooks on the internal attn logic often.
            
    def save_activation(self, name, output):
        # Move to CPU and numpy
        if isinstance(output, tuple):
            output = output[0] # Handle cases where output is a tuple (loss, logits, etc)
        self.activations[name] = output.detach().cpu().numpy()

    def run_inference(self, text):
        print(f"Running inference on: '{text}'")
        inputs = self.tokenizer(text, return_tensors="pt")
        
        # We run with output_attentions=True to catch the attention matrices easily
        with torch.no_grad():
            outputs = self.model(**inputs, output_attentions=True)
            
        print("Inference done.")
        return inputs, outputs

    def export(self):
        ensure_dir(OUTPUT_DIR)
        
        # 1. Export Weights
        print("Exporting weights...")
        weights_dir = os.path.join(OUTPUT_DIR, 'weights')
        ensure_dir(weights_dir)
        
        manifest = {"layers": []}
        
        for name, param in self.model.named_parameters():
            # Save raw binary
            safe_name = name.replace('.', '_')
            file_name = f"{safe_name}.bin"
            path = os.path.join(weights_dir, file_name)
            
            data = param.detach().cpu().numpy()
            data.tofile(path)
            
            manifest["layers"].append({
                "name": name,
                "file": file_name,
                "shape": data.shape,
                "dtype": str(data.dtype)
            })
            
        # 2. Export Activations
        print("Exporting activations...")
        acts_dir = os.path.join(OUTPUT_DIR, 'activations')
        ensure_dir(acts_dir)
        
        act_manifest = {"steps": []}
        
        # Note: In a real generation loop, we'd have multiple steps. 
        # Here we did a single forward pass of the prompt.
        # So essentially 'step 0' is the processing of the prompt.
        
        step_data = []
        for name, data in self.activations.items():
            safe_name = name.replace('.', '_')
            file_name = f"act_{safe_name}.bin"
            path = os.path.join(acts_dir, file_name)
            data.tofile(path)
            
            step_data.append({
                "name": name,
                "file": file_name,
                "shape": data.shape
            })
            
        act_manifest["steps"].append({
            "id": 0,
            "activations": step_data
        })
        
        # Save manifests
        with open(os.path.join(OUTPUT_DIR, 'model_manifest.json'), 'w') as f:
            json.dump(manifest, f, indent=2)
            
        with open(os.path.join(OUTPUT_DIR, 'activation_manifest.json'), 'w') as f:
            json.dump(act_manifest, f, indent=2)
            
        print(f"Done. Exported to {OUTPUT_DIR}")

if __name__ == "__main__":
    exporter = ModelExporter()
    exporter.register_hooks()
    exporter.run_inference(PROMPT)
    exporter.export()
