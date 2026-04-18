from __future__ import annotations

import json
import logging
import re
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from backend.agent.input_safety import sanitize_user_text
from backend.agent.tools import (
    MAYA_SMB_ID,
    PRIYA_SMB_ID,
    WALKTHROUGH_CREDIT_DENY_MIN,
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

WALKTHROUGH_SMB_IDS = frozenset({MAYA_SMB_ID, PRIYA_SMB_ID})

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


def _looks_like_cash_flow(message: str) -> bool:
    """Heuristic when the LLM classifier returns general_chat/faq for obvious forecast asks."""
    m = (message or "").lower()
    if any(
        x in m
        for x in (
            "credit line",
            "line of credit",
            "borrow",
            "pre-qual",
            "prequal",
            "loan for",
        )
    ) and "cash flow" not in m:
        return False
    if "cash flow" in m or "cashflow" in m:
        return True
    if "what's my cash" in m or "what is my cash" in m:
        return True
    if "forecast" in m and any(
        x in m for x in ("revenue", "expense", "net", "projection", "projected", "30")
    ):
        return True
    return False


def _refine_intent(message: str, intent: str) -> str:
    if intent in ("credit_prequal_request", "escalate_to_banker"):
        return intent
    if intent in ("general_chat", "faq_question") and _looks_like_cash_flow(message):
        return "cash_flow_query"
    return intent


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

    intent = _refine_intent(state["message"], intent)

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


def _format_cash_flow_reply(tool_result: dict[str, Any]) -> str:
    """Deterministic forecast text so we never show a generic greeting when data exists."""
    rev = tool_result.get("projected_30_day_revenue")
    exp = tool_result.get("projected_30_day_expenses")
    net = tool_result.get("projected_net")
    risk = tool_result.get("risk_flag", "medium")
    name = tool_result.get("smb_name") or "your business"
    if rev is None or exp is None or net is None:
        return ""
    return (
        f"Here's your illustrative 30-day cash flow outlook for {name} based on recent activity in this app: "
        f"about ${rev:,.0f} in revenue and ${exp:,.0f} in expenses, for a net of about ${net:,.0f}. "
        f"Risk outlook: {risk}. This is a demo projection, not audited financials; your RM or statements are "
        f"authoritative for real planning."
    )


async def reply_composer_node(state: AgentState) -> dict:
    intent = state.get("intent", "")
    tr = dict(state.get("tool_result") or {})
    smb_id = state.get("smb_id", "")
    if (
        intent == "cash_flow_query"
        and "error" not in tr
        and "projected_net" in tr
    ):
        formatted = _format_cash_flow_reply(tr)
        if formatted:
            return {"reply": formatted}

    if intent == "credit_prequal_request":
        wt = _format_walkthrough_credit_reply(smb_id, tr)
        if wt:
            return {"reply": wt}

    reply = await compose_reply(
        message=state["message"],
        tool_result=tr,
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
    if base.get("walkthrough_credit_denial"):
        merged["rm_review_notice"] = (
            "Your Relationship Manager will follow up on the reasons above and what alternatives may fit. "
            "This instant check is not a final credit decision."
        )
    else:
        merged["rm_review_notice"] = (
            "Amounts over $10K go to your RM and underwriting. "
            "Watch Activity for the final decision, usually within two to three business days."
        )
    return merged


def _format_walkthrough_credit_reply(smb_id: str, tool_result: dict[str, Any]) -> str:
    """Deterministic copy for Maya/Priya: decline + tie-in to skit + RM follow-up (matches escalation merge)."""
    if tool_result.get("needs_more_info"):
        return ""
    if smb_id not in WALKTHROUGH_SMB_IDS:
        return ""
    if tool_result.get("eligible") is not False:
        return ""
    reasons = tool_result.get("decline_reasons") or []
    if isinstance(reasons, list) and reasons:
        reason_para = " ".join(reasons)
    else:
        reason_para = (tool_result.get("reason") or "").strip()
    if not reason_para:
        return ""

    if smb_id == MAYA_SMB_ID:
        hook = (
            "That reflects the same seasonal cash-flow tension we have been discussing: strong peaks, "
            "then a thin winter window against payroll and supply costs."
        )
    else:
        hook = (
            "That lines up with the equipment spend and uneven weekly deposits we walked through: "
            "the automated check needs a Relationship Manager to validate timing and headroom before new credit."
        )

    prior = tool_result.get("prior_underwriting_decision")
    prior_bit = f" {prior}" if prior else ""

    rm = tool_result.get("assigned_rm") or {}
    rm_name = rm.get("name") if isinstance(rm, dict) else None
    ticket = tool_result.get("ticket_number")
    email = rm.get("email") if isinstance(rm, dict) else None

    intro = (
        "The instant pre-qualification here is not approving a new line at the amount you asked for. "
        f"{reason_para}{prior_bit} "
        f"{hook} "
    )

    if rm_name and ticket:
        outro = (
            f"Connect with your Relationship Manager, {rm_name}, to go deeper on the details and options; "
            f"I have opened ticket {ticket} for follow-up. "
        )
        if email:
            outro += f"You can also reach them at {email}."
    elif rm_name:
        outro = (
            f"Use Connect with your RM in the app to reach {rm_name} so they can review the full picture with you."
        )
    else:
        outro = "Use Connect with your RM in the app so your Relationship Manager can walk through next steps."

    return (intro + outro).strip()


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
        smb_id = state["smb_id"]
        requested = tool_result.get("requested_amount", 0)
        eligible = tool_result.get("eligible", False)
        probability = float(tool_result.get("probability") or 0.0)

        escalate = False
        esc_reason = ""

        if requested > 10_000:
            escalate = True
            esc_reason = (
                f"Loan request of ${requested:,}  - "
                f"{'pre-qualified' if eligible else 'not pre-qualified'}. "
                f"Auto-escalated (amount > $10K)."
            )
        elif (
            smb_id in WALKTHROUGH_SMB_IDS
            and not eligible
            and requested >= WALKTHROUGH_CREDIT_DENY_MIN
        ):
            escalate = True
            summary = (tool_result.get("reason") or "").strip()
            esc_reason = (
                f"Walkthrough credit follow-up: instant pre-qual did not approve ${requested:,}; "
                f"RM to discuss details. Context: {summary[:450]}"
            )

        if escalate:
            esc_result = await escalate_to_banker(
                smb_id,
                reason=esc_reason,
                urgency="high",
                requested_amount=requested,
                credit_score=probability,
            )
            logger.info(
                "Auto-escalated credit: smb_id=%s amount=%d eligible=%s",
                smb_id,
                requested,
                eligible,
            )
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
    message = sanitize_user_text(message)
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
