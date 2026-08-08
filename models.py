import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import time


class LLMManager:
    def __init__(
        self,
        model_name="Qwen/Qwen2.5-0.5B-Instruct",
        model_revision="7ae557604adf67be50417f59c2c2f167def9a775",
    ):
        self.model_name = model_name
        self.model_revision = model_revision
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        start_time = time.time()
        print(f"Loading model {model_name}@{model_revision} on {self.device}...")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                revision=model_revision,
            )
            dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                revision=model_revision,
                torch_dtype=dtype,
                device_map=self.device,
            )
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                "The installed transformers package cannot load the configured Qwen model. "
                "Recreate the environment with the pinned dependencies from requirements.txt "
                "or run `pip install -r requirements.txt --upgrade`."
            ) from exc
        
        load_time = time.time() - start_time
        print(f"Model loaded in {load_time:.2f} seconds.")
        
    def generate(self, prompt: str, system_prompt: str = "You are a helpful, precise support agent for OrbitDesk.", max_new_tokens: int = 512, temperature: float = 0.3) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        model_inputs = self.tokenizer([text], return_tensors="pt").to(self.device)
        
        start_time = time.time()
        generated_ids = self.model.generate(
            model_inputs.input_ids,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=self.tokenizer.eos_token_id
        )
        
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]
        
        response = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
        return response.strip()

llm_manager = None
def get_llm():
    global llm_manager
    if llm_manager is None:
        llm_manager = LLMManager()
    return llm_manager
