# GraphStudio: Interactive LLM Visualization

A "Game Engine for Mathematics" designed to visualize and understand Large Language Models.

## Features implemented so far:

1.  **Single Neuron Visualization**: Only available in "Phase 1" of your learning. Shows weights, biases, and activation. 
2.  **Matrix Multiplication (MatMul) Visualization**: The core operation of LLMs. Shows two matrices identifying their dot products.
3.  **The Tower (Transformer Blocks)**: Shows the "Residual Stream" concept with Attention and MLP blocks adding to the stream.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
    *(Already done)*

2.  **Run the App**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000)

## Exporting Real Models (Advanced)

To visualize a real GPT-2 model (Phase 2), use the Python exporter:

1.  Navigate to `exporter/`
2.  Install python deps: `pip install -r requirements.txt`
3.  Run: `python export_model.py`
4.  This will save `.bin` files to `exporter/data_export/`.
