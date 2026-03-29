from typing import List, Dict, Any, TypedDict
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

# 1. State Definition
class AgentState(TypedDict):
    interests: str
    language: str
    raw_articles: List[Dict[str, Any]]
    filtered_articles: List[Dict[str, Any]]
    final_feed: List[Dict[str, Any]]
    messages: List[str]  # SSE logs

# 2. Structured Outputs
class FilterDecision(BaseModel):
    article_id: int = Field(description="The ID of the article")
    is_relevant: bool = Field(description="True if the article matches the user's interests, False otherwise")
    match_reason: str = Field(description="If relevant, a concise 1-sentence reason explaining why the user would care, localized to their context. Empty if not relevant.")

class FilterList(BaseModel):
    decisions: List[FilterDecision]


def _tokenize_interests(interests: str) -> List[str]:
    parts = [p.strip().lower() for p in interests.replace("/", ",").split(",")]
    tokens: List[str] = []
    for part in parts:
        for word in part.split():
            clean = "".join(ch for ch in word if ch.isalnum() or ch in {"-", "+"})
            if len(clean) >= 3:
                tokens.append(clean)
    return list(dict.fromkeys(tokens))


def _fallback_filter(raw_articles: List[Dict[str, Any]], interests: str) -> List[Dict[str, Any]]:
    tokens = _tokenize_interests(interests)
    if not tokens:
        return raw_articles[:12]

    ranked: List[tuple[int, Dict[str, Any], str]] = []
    for article in raw_articles:
        title = (article.get("title") or "").lower()
        summary = (article.get("summary") or "").lower()
        haystack = f"{title} {summary}"

        matches = [token for token in tokens if token in haystack]
        if not matches:
            continue

        reason_tokens = ", ".join(matches[:3])
        reason = f"This story is relevant to your interests around {reason_tokens}."
        score = len(matches)

        enriched = dict(article)
        enriched["match_reason"] = reason
        ranked.append((score, enriched, reason))

    ranked.sort(key=lambda item: item[0], reverse=True)
    return [item[1] for item in ranked[:12]]

# 3. Nodes
def fetch_node(state: AgentState):
    """Note: The actual fetching happens outside the graph in main.py to avoid circular imports.
       This node just records that the agent received the payload."""
    count = len(state.get("raw_articles", []))
    state["messages"] = [f"[Fetch Agent] Gathering latest headlines in '{state['language']}'...", 
                         f"✓ [Fetch Agent] Successfully aggregated {count} raw articles."]
    return state

def filter_node(state: AgentState):
    messages = state.get("messages", [])
    messages.append(f"[Filter Agent] Analyzing articles against user interests: '{state['interests']}'...")
    
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    structured_llm = llm.with_structured_output(FilterList)
    
    # Build prompt
    articles_text = "\n".join(
        f"ID: {a['id']} | Title: {a['title']} | Summary: {a.get('summary', '')[:200]}"
        for a in state["raw_articles"]
    )
    
    prompt = f"""You are a senior news editor personalizing a news feed.
User's explicit interests: {state['interests']}

Review the following articles. For each one, determine if it aligns with the user's interests.
If it is highly relevant, assign a 'match_reason' describing why they should read it. Be very brief (1 sentence).

Articles:
{articles_text}
"""
    try:
        result = structured_llm.invoke(prompt)
        
        # Track valid matches
        decision_map = {d.article_id: d for d in result.decisions if d.is_relevant}
        
        filtered = []
        for a in state["raw_articles"]:
            if a["id"] in decision_map:
                # Ensure the original dictionary isn't mutated in a way that breaks outer caching
                new_a = dict(a)
                new_a["match_reason"] = decision_map[a["id"]].match_reason
                filtered.append(new_a)
                
        if filtered:
            state["filtered_articles"] = filtered
            messages.append(f"✓ [Filter Agent] Found {len(filtered)} highly relevant articles.")
        else:
            fallback = _fallback_filter(state["raw_articles"], state["interests"])
            state["filtered_articles"] = fallback
            messages.append(
                f"[Filter Agent] LLM returned no matches. Applied lexical fallback and selected {len(fallback)} articles."
            )
    except Exception as e:
        fallback = _fallback_filter(state["raw_articles"], state["interests"])
        messages.append(f"❌ [Filter Agent] Error occurred during filtering: {str(e)}")
        messages.append(
            f"[Filter Agent] Switched to deterministic fallback scoring. Selected {len(fallback)} articles."
        )
        state["filtered_articles"] = fallback
        
    state["messages"] = messages
    return state

def format_node(state: AgentState):
    messages = state.get("messages", [])
    messages.append("[Format Agent] Finalizing personalized feed and preparing JSON payload...")
    
    state["final_feed"] = state.get("filtered_articles", [])
    messages.append("✓ [Format Agent] Feed ready for Delivery!")
    
    state["messages"] = messages
    return state

# 4. Graph Compilation
workflow = StateGraph(AgentState)
workflow.add_node("fetch", fetch_node)
workflow.add_node("filter", filter_node)
workflow.add_node("format", format_node)

workflow.set_entry_point("fetch")
workflow.add_edge("fetch", "filter")
workflow.add_edge("filter", "format")
workflow.add_edge("format", END)

my_et_agent_app = workflow.compile()
