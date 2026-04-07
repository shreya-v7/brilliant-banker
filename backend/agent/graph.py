from __future__ import annotations

import json
import logging
import re
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from backend.agent.tools import (
    check_credit_prequal,
    escalate_to_banker,
    get_cash_flow_forecast,
    search_faq,
)
from backend.services.claude_service import classify_intent, compose_reply

logger = logging.getLogger(__name__)


class AgentState(TypedDict, total=False):
    smb_id: str
    phone: str
    message: str
    history: list[dict[str, Any]]
    intent: str
    tool_result: dict[str, Any]
    reply: str
    escalated: bool


def _parse_amount_from_message(message: str) -> int:
    """Extract a dollar amount from the user message, default to 50000."""
    patterns = [
        r"\$\s*([\d,]+(?:\.\d+)?)\s*[kK]",
        r"\$\s*([\d,]+(?:\.\d+)?)",
        r"([\d,]+(?:\.\d+)?)\s*(?:dollars|usd)",
        r"([\d,]+)\s*[kK]\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            raw = match.group(1).replace(",", "")
            amount = float(raw)
            if "k" in message[match.start():match.end()].lower():
                amount *= 1000
            return int(amount)
    return 50_000


async def intent_classifier_node(state: AgentState) -> dict:
    raw = await classify_intent(state["message"], state.get("history", []))
    try:
        parsed = json.loads(raw)
        intent = parsed.get("intent", "general_chat")
    except (json.JSONDecodeError, KeyError):
        intent = "general_chat"

    valid_intents = {
        "cash_flow_query",
        "credit_prequal_request",
        "faq_question",
        "escalate_to_banker",
        "general_chat",
    }
    if intent not in valid_intents:
        intent = "general_chat"

    logger.info("Classified intent: %s (raw: %s)", intent, raw.strip())
    return {"intent": intent}


async def tool_router_node(state: AgentState) -> dict:
    intent = state["intent"]
    smb_id = state["smb_id"]
    message = state["message"]

    if intent == "cash_flow_query":
        result = await get_cash_flow_forecast(smb_id)
    elif intent == "credit_prequal_request":
        amount = _parse_amount_from_message(message)
        result = await check_credit_prequal(smb_id, amount)
    elif intent == "faq_question":
        result = await search_faq(message)
    elif intent == "escalate_to_banker":
        result = await escalate_to_banker(smb_id, reason=message, urgency="high")
    else:
        result = {"response": "general_chat", "message": message}

    return {"tool_result": result}


async def reply_composer_node(state: AgentState) -> dict:
    reply = await compose_reply(
        message=state["message"],
        tool_result=state.get("tool_result", {}),
        history=state.get("history", []),
    )
    return {"reply": reply}


async def escalation_checker_node(state: AgentState) -> dict:
    tool_result = state.get("tool_result", {})
    intent = state.get("intent", "")
    already_escalated = state.get("intent") == "escalate_to_banker"

    if already_escalated:
        return {"escalated": True}

    if intent == "credit_prequal_request":
        requested = tool_result.get("requested_amount", 0)
        if requested > 10_000:
            smb_id = state["smb_id"]
            eligible = tool_result.get("eligible", False)
            reason = (
                f"Loan request of ${requested:,} — "
                f"{'pre-qualified' if eligible else 'not pre-qualified'}. "
                f"Auto-escalated (amount > $10K)."
            )
            await escalate_to_banker(smb_id, reason=reason, urgency="high")
            logger.info("Auto-escalated: smb_id=%s amount=%d", smb_id, requested)
            return {"escalated": True}

    return {"escalated": False}


def build_agent_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("intent_classifier", intent_classifier_node)
    graph.add_node("tool_router", tool_router_node)
    graph.add_node("reply_composer", reply_composer_node)
    graph.add_node("escalation_checker", escalation_checker_node)

    graph.set_entry_point("intent_classifier")
    graph.add_edge("intent_classifier", "tool_router")
    graph.add_edge("tool_router", "reply_composer")
    graph.add_edge("reply_composer", "escalation_checker")
    graph.add_edge("escalation_checker", END)

    return graph.compile()


agent = build_agent_graph()


async def run_agent(
    smb_id: str,
    phone: str,
    message: str,
    history: list[dict[str, Any]] | None = None,
) -> AgentState:
    initial_state: AgentState = {
        "smb_id": smb_id,
        "phone": phone,
        "message": message,
        "history": history or [],
        "intent": "",
        "tool_result": {},
        "reply": "",
        "escalated": False,
    }
    result = await agent.ainvoke(initial_state)
    return result
