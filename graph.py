import json
from typing import TypedDict, List, Dict, Optional
from langgraph.graph import StateGraph, START, END
from models import get_llm
from ingest import KnowledgeBase

class AgentState(TypedDict):
    question: str
    classification: Optional[str]
    retrieved_documents: List[Dict]
    generated_answer: Optional[str]
    sources_used: List[Dict]
    verification_status: Optional[str]
    verification_reason: Optional[str]
    loop_count: int
    final_response: Optional[Dict]

kb_instance = None 

def init_kb(kb: KnowledgeBase):
    global kb_instance
    kb_instance = kb

def _rule_based_classification(question: str) -> str:
    text = question.lower()

    if any(term in text for term in ["refund", "legal advice", "lawyer", "subscription", "cancel my account"]):
        return "out_of_scope"

    if "ignore the supplied documentation" in text or "ignore the docs" in text:
        return "requires_escalation"

    if "render_failed" in text:
        if any(term in text for term in ["two", "2", "again", "in a row", "consecutive"]):
            return "requires_escalation"
        return "requires_clarification"

    if any(term in text for term in ["timezone", "schedule", "scheduled export", "export stopped", "missed export"]):
        return "answerable"

    if "api credential" in text or "api credentials" in text:
        return "answerable"

    if "sync is not working" in text or ("sync" in text and "not working" in text):
        return "requires_clarification"

    if any(term in text for term in ["permission_denied", "access revoked", "role", "viewer", "admin"]):
        return "answerable"

    if any(term in text for term in ["dashboard", "connection", "destination", "refresh", "export"]):
        return "answerable"

    return "requires_clarification"

def triage_node(state: AgentState):
    classification = _rule_based_classification(state["question"])
    return {"classification": classification, "loop_count": 0}

def retrieve_node(state: AgentState):
    global kb_instance
    docs = kb_instance.search(state["question"], top_k=3)
    return {"retrieved_documents": docs}

def generate_node(state: AgentState):
    llm = get_llm()
    docs = state.get("retrieved_documents", [])
    
    context = ""
    for idx, doc in enumerate(docs):
        context += f"Document ID: {doc['source_id']}\nContent: {doc['content']}\n\n"
        
    prompt = f"""
Using ONLY the following knowledge base documents, answer the user's question. 
If the information is not in the documents, state that you don't know and the request might need clarification or escalation.
Do not invent information. Do not assume you can perform account actions.

Knowledge Base:
{context}

User Question: {state['question']}

Provide a clear and helpful response.
"""
    answer = llm.generate(prompt, max_new_tokens=256)
    
    sources_used = []
    for doc in docs:
        sources_used.append({"source_id": doc["source_id"], "passage": doc["content"][:100] + "..."})
        
    return {"generated_answer": answer, "sources_used": sources_used, "loop_count": state.get("loop_count", 0) + 1}

def verify_node(state: AgentState):
    llm = get_llm()
    docs = state.get("retrieved_documents", [])
    answer = state.get("generated_answer", "")
    
    context = ""
    for doc in docs:
        context += f"Content: {doc['content']}\n\n"
        
    prompt = f"""
Evaluate if the following generated answer is fully supported by the provided evidence.
Answer: {answer}

Evidence:
{context}

Does the answer invent unsupported instructions or assume capabilities not mentioned in the evidence? 
Respond with ONLY "pass" if the answer is supported and safe, or "fail" if it invents information or violates constraints.
"""
    result = llm.generate(prompt, max_new_tokens=10).strip().lower()
    status = "pass" if "pass" in result else "fail"
    
    return {"verification_status": status, "verification_reason": result}

def format_output_node(state: AgentState):
    cls = state["classification"]
    
    if cls == "answerable" and state.get("verification_status") == "pass":
        final_response = {
            "classification": cls,
            "answer": state["generated_answer"],
            "sources": state["sources_used"],
            "confidence": 0.85,
            "requires_human": False,
            "reason": "Successfully answered using knowledge base."
        }
    elif cls == "requires_clarification":
        final_response = {
            "classification": cls,
            "answer": "Could you please provide more details?",
            "sources": [],
            "confidence": 0.9,
            "requires_human": True,
            "reason": "The request is ambiguous."
        }
    elif cls == "requires_escalation":
        final_response = {
            "classification": cls,
            "answer": "I will escalate this issue to our support team for further investigation.",
            "sources": [],
            "confidence": 0.9,
            "requires_human": True,
            "reason": "The issue requires advanced troubleshooting."
        }
    elif cls == "out_of_scope":
        final_response = {
            "classification": cls,
            "answer": "I am unable to perform account changes, issue refunds, or provide legal advice.",
            "sources": [],
            "confidence": 0.95,
            "requires_human": True,
            "reason": "Request is outside the safe scope of this agent."
        }
    else:
        final_response = {
            "classification": "safe_failure",
            "answer": "I am currently unable to provide a safe answer to this request.",
            "sources": [],
            "confidence": 0.0,
            "requires_human": True,
            "reason": "Fallback due to verification failure or unknown state."
        }
        
    return {"final_response": final_response}

def safe_failure_node(state: AgentState):
    final_response = {
        "classification": "safe_failure",
        "answer": "I'm sorry, but I cannot confidently answer this request based on the available documentation. I will escalate this.",
        "sources": [],
        "confidence": 0.1,
        "requires_human": True,
        "reason": f"Failed verification after {state.get('loop_count')} attempts."
    }
    return {"final_response": final_response}

def route_after_triage(state: AgentState) -> str:
    if state["classification"] == "answerable":
        return "retrieve"
    return "format"

def route_after_verify(state: AgentState) -> str:
    if state["verification_status"] == "pass":
        return "format"
    elif state["loop_count"] < 2:
        return "generate" 
    else:
        return "safe_failure"

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("triage", triage_node)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("generate", generate_node)
    workflow.add_node("verify", verify_node)
    workflow.add_node("format", format_output_node)
    workflow.add_node("safe_failure", safe_failure_node)
    
    workflow.add_edge(START, "triage")
    workflow.add_conditional_edges("triage", route_after_triage, {"retrieve": "retrieve", "format": "format"})
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", "verify")
    workflow.add_conditional_edges("verify", route_after_verify, {"format": "format", "generate": "generate", "safe_failure": "safe_failure"})
    workflow.add_edge("format", END)
    workflow.add_edge("safe_failure", END)
    
    return workflow.compile()
