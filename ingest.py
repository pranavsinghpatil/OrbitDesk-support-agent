import os
import json
import glob
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

class KnowledgeBase:
    def __init__(self, embedding_model_name="all-MiniLM-L6-v2"):
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.documents = []
        self.index = None
    
    def load_markdown_files(self, kb_dir):
        files = glob.glob(os.path.join(kb_dir, "*.md"))
        for file in files:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                filename = os.path.basename(file)
                self.documents.append({
                    "source_id": filename,
                    "content": content,
                    "type": "kb"
                })
                
    def load_resolved_cases(self, cases_file):
        with open(cases_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for case in data.get("cases", []):
            if case.get("status") == "superseded":
                continue # Skip superseded cases
            
            content = f"Title: {case.get('title')}\nSymptoms: {', '.join(case.get('symptoms', []))}\nResolution: {', '.join(case.get('resolution', []))}"
            if "important_limit" in case:
                content += f"\nImportant Limit: {case['important_limit']}"
                
            self.documents.append({
                "source_id": case.get("case_id"),
                "content": content,
                "type": "case"
            })
            
    def build_index(self):
        if not self.documents:
            return
            
        texts = [doc["content"] for doc in self.documents]
        embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
        
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
        
    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        query_embedding = self.embedding_model.encode([query])
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), top_k)
        
        results = []
        for idx in indices[0]:
            if idx != -1 and idx < len(self.documents):
                results.append(self.documents[idx])
        return results

# Expose a ready-to-use function to initialize
def initialize_kb(base_dir: str) -> KnowledgeBase:
    kb = KnowledgeBase()
    kb.load_markdown_files(os.path.join(base_dir, "knowledge_base"))
    kb.load_resolved_cases(os.path.join(base_dir, "resolved_cases.json"))
    kb.build_index()
    return kb
