import argparse
import json
import os
import time

from graph import build_graph, init_kb
from ingest import initialize_kb


def build_initial_state(question: str) -> dict:
    return {
        "question": question,
        "classification": None,
        "retrieved_documents": [],
        "generated_answer": None,
        "sources_used": [],
        "verification_status": None,
        "verification_reason": None,
        "loop_count": 0,
        "final_response": None,
    }


def load_questions(base_dir: str, questions_path: str | None, question: str | None):
    if question:
        return [{"question_id": "ad-hoc", "question": question}]

    path = questions_path or os.path.join(base_dir, "sample_questions.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("questions", [])


def run(question: str | None = None, questions_path: str | None = None):
    base_dir = os.path.dirname(os.path.abspath(__file__))

    print("Initializing knowledge base...")
    start_time = time.time()
    kb = initialize_kb(base_dir)
    init_kb(kb)
    print(f"Knowledge base initialized in {time.time() - start_time:.2f}s")

    print("Building workflow...")
    workflow = build_graph()

    questions = load_questions(base_dir, questions_path, question)
    results = []

    for item in questions:
        question_text = item["question"]
        question_id = item.get("question_id", "unknown")

        print(f"\n{'-' * 60}")
        print(f"Question: {question_id}")
        print(f"Input: {question_text}")

        start_time = time.time()
        final_state = workflow.invoke(build_initial_state(question_text))
        latency = time.time() - start_time

        response = final_state["final_response"]
        results.append(
            {
                "question_id": question_id,
                "question": question_text,
                "latency_seconds": round(latency, 2),
                "response": response,
            }
        )

        print(f"Latency: {latency:.2f}s")
        print(json.dumps(response, indent=2))

    return results


def parse_args():
    parser = argparse.ArgumentParser(description="Run the OrbitDesk support agent.")
    parser.add_argument(
        "--question",
        help="Run the agent for a single ad-hoc question.",
    )
    parser.add_argument(
        "--questions-file",
        help="Path to a JSON file with a questions array. Defaults to sample_questions.json.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(question=args.question, questions_path=args.questions_file)
