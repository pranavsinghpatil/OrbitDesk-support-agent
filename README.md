# OrbitDesk Support Agent

This project is an AI support assistant for a fictional SaaS product called OrbitDesk.
It answers customer-support questions using only the supplied documentation and resolved cases.

### Video Recording Link

- Video URL: [ Demo Video](https://www.loom.com/share/c090f5f35b9f41a9ae6725b6d8c82ca3)
  

## What it does

- Classifies the user request as answerable, clarification-needed, escalation-needed, or out of scope
- Retrieves supporting evidence from the knowledge base and resolved cases
- Generates a grounded response
- Verifies that the answer stays within the supplied material
- Returns a structured JSON response that can be consumed by a UI or API

## Project Structure

- `main.py` - CLI entrypoint for running sample questions or a single ad-hoc question
- `graph.py` - LangGraph workflow for triage, retrieval, generation, verification, and formatting
- `ingest.py` - Builds the knowledge-base index from docs and resolved cases
- `models.py` - Local LLM wrapper
- `knowledge_base/` - Primary product documentation
- `resolved_cases.json` - Historical cases for retrieval
- `sample_questions.json` - Demo questions for the assignment
- `output_schema.json` - Structured response contract

## Setup

Install the required packages from `requirements.txt`.

## Run

Run the built-in sample questions:

```bash
python main.py
```

Run a single question:

```bash
python main.py --question "Our daily dashboard exports stopped appearing after a timezone change."
```

Run a custom question file:

```bash
python main.py --questions-file path/to/questions.json
```

## Notes

- The assistant only uses the provided OrbitDesk documentation and resolved cases.
- It does not claim to change accounts, issue refunds, or contact external parties.
- The response format follows `output_schema.json`.


### Graph Diagram 

- Diagram file: [orbitdesk_graph_diagram.png](orbitdesk_graph_diagram.png)


### Exact Model Names and Revisions

This project uses two model families:

- Generation model (from `models.py`):
	- Name: `Qwen/Qwen2.5-0.5B-Instruct`
	- Revision: `7ae557604adf67be50417f59c2c2f167def9a775`
- Embedding model (from `ingest.py`):
	- Name: `sentence-transformers/all-MiniLM-L6-v2`
	- Revision: `1110a243fdf4706b3f48f1d95db1a4f5529b4d41`

Verified Python package versions used for the run:
- `transformers==4.57.0`
- `sentence-transformers==5.1.1`
- `torch==2.8.0`
- `accelerate==1.11.0`

### Hardware Requirements and Run Hardware

Minimum practical requirements for this repository:
- CPU: x86_64 multi-core processor
- RAM: 8 GB minimum (16 GB recommended)
- GPU/accelerator: Optional (CPU-only works; CUDA-capable GPU can improve latency)

Hardware used for this run:
- CPU: `11th Gen Intel(R) Core(TM) i5-11300H @ 3.10GHz` (4 cores, 8 logical processors)
- RAM: `16 GB`
- GPU: `Intel(R) Iris(R) Xe Graphics`
- Accelerator usage in this run: `CPU-only` (no CUDA device used)

### Generated Artifact Files

- `sample_outputs.json` (produced by running all prompts from `sample_questions.json`)
- `orbitdesk_graph_diagram.png` (workflow diagram image)
