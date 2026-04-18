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
from backend.services.claude_service import (
    classify_intent,
    compose_reply,
    check_credit_info_completeness,
)

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
    escalation_result: dict[str, Any]


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
    history = state.get("history", [])

    if intent == "cash_flow_query":
        result = await get_cash_flow_forecast(smb_id)
    elif intent == "credit_prequal_request":
        amount = _parse_amount_from_message(message)

        # Cross-question: check if we have enough info before evaluating
        try:
            info_check = await check_credit_info_completeness(message, history)
        except Exception:
            info_check = {"all_complete": True, "missing_questions": []}

        if not info_check.get("all_complete", True) and info_check.get("missing_questions"):
            questions = info_check["missing_questions"]
            result = {
                "response": "credit_info_gathering",
                "needs_more_info": True,
                "missing_questions": questions,
                "requested_amount": amount,
                "message": (
                    "Before I can run a pre-qualification, I need a bit more information. "
                    + " ".join(questions)
                ),
            }
        else:
            result = await check_credit_prequal(smb_id, amount)
    elif intent == "faq_question":
        result = await search_faq(message)
    elif intent == "escalate_to_banker":
        amount = _parse_amount_from_message(message)
        has_amount = amount != 50_000
        result = await escalate_to_banker(
            smb_id,
            reason=message,
            urgency="high",
            requested_amount=amount if has_amount else None,
        )
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


def _merge_ticket_into_tool_result(
    base: dict[str, Any],
    esc: dict[str, Any],
) -> dict[str, Any]:
    """Attach RM ticket fields to prequal (or other) tool output without clobbering prequal keys."""
    merged = {**base}
    merged["ticket_number"] = esc.get("ticket_number")
    merged["assigned_rm"] = esc.get("assigned_rm")
    merged["lead_id"] = esc.get("lead_id")
    merged["rm_review_notice"] = (
        "Amounts over $10K go to your RM and underwriting. "
        "Watch Activity for the final decision, usually within two to three business days."
    )
    return merged


async def escalation_checker_node(state: AgentState) -> dict:
    tool_result = dict(state.get("tool_result") or {})
    intent = state.get("intent", "")

    if intent == "escalate_to_banker":
        return {
            "escalated": True,
            "escalation_result": tool_result,
            "tool_result": tool_result,
        }

    if intent == "credit_prequal_request" and not tool_result.get("needs_more_info"):
        requested = tool_result.get("requested_amount", 0)
        if requested > 10_000:
            smb_id = state["smb_id"]
            eligible = tool_result.get("eligible", False)
            probability = tool_result.get("probability", 0.0)
            reason = (
                f"Loan request of ${requested:,}  - "
                f"{'pre-qualified' if eligible else 'not pre-qualified'}. "
                f"Auto-escalated (amount > $10K)."
            )
            esc_result = await escalate_to_banker(
                smb_id,
                reason=reason,
                urgency="high",
                requested_amount=requested,
                credit_score=probability,
            )
            logger.info("Auto-escalated: smb_id=%s amount=%d score=%.2f", smb_id, requested, probability)
            merged = _merge_ticket_into_tool_result(tool_result, esc_result)
            return {
                "escalated": True,
                "escalation_result": esc_result,
                "tool_result": merged,
            }

    return {"escalated": False, "tool_result": tool_result}


def build_agent_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("intent_classifier", intent_classifier_node)
    graph.add_node("tool_router", tool_router_node)
    graph.add_node("reply_composer", reply_composer_node)
    graph.add_node("escalation_checker", escalation_checker_node)

    graph.set_entry_point("intent_classifier")
    graph.add_edge("intent_classifier", "tool_router")
    graph.add_edge("tool_router", "escalation_checker")
    graph.add_edge("escalation_checker", "reply_composer")
    graph.add_edge("reply_composer", END)

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
        "escalation_result": {},
    }
    result = await agent.ainvoke(initial_state)
    return result
