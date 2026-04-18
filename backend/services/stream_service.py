"""
In-memory event broadcast replacing Redis pub/sub.

Publishers  : chat endpoint, escalation tool, decision endpoint
Subscribers : SSE endpoint consumed by the RM dashboard
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

logger = logging.getLogger(__name__)

_subscribers: list[asyncio.Queue] = []


async def publish_event(event: dict[str, Any]) -> None:
    event.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
    for q in list(_subscribers):
        try:
            q.put_nowait(event)
        except asyncio.QueueFull:
            pass
    logger.info("Stream event published: %s [%s]", event.get("event_type"), event.get("smb_name", ""))


async def subscribe_events() -> AsyncGenerator[dict[str, Any], None]:
    q: asyncio.Queue = asyncio.Queue(maxsize=256)
    _subscribers.append(q)
    try:
        while True:
            event = await q.get()
            yield event
    finally:
        _subscribers.remove(q)


# ── Pre-built event constructors ──────────────────────────────────────────────

INTENT_LABELS = {
    "cash_flow_query": "Cash Flow",
    "credit_prequal_request": "Credit Request",
    "faq_question": "General FAQ",
    "escalate_to_banker": "RM Escalation",
    "general_chat": "General",
}


def chat_highlight_event(
    smb_id: str,
    smb_name: str,
    intent: str,
    highlight: str,
    escalated: bool = False,
    urgency: str = "low",
    requested_amount: int | None = None,
    ticket_number: str | None = None,
    rm_name: str | None = None,
    topic_summary: str | None = None,
    user_message: str | None = None,
) -> dict[str, Any]:
    event = {
        "event_type": "chat_highlight",
        "smb_id": smb_id,
        "smb_name": smb_name,
        "intent": intent,
        "intent_label": INTENT_LABELS.get(intent, intent),
        "highlight": highlight,
        "escalated": escalated,
        "urgency": urgency,
        "requested_amount": requested_amount,
        "topic_summary": topic_summary or highlight,
        "user_message_preview": (user_message or "")[:120],
    }
    if ticket_number:
        event["ticket_number"] = ticket_number
    if rm_name:
        event["rm_name"] = rm_name
    return event


def escalation_event(
    smb_id: str,
    smb_name: str,
    reason: str,
    requested_amount: int | None = None,
    credit_score: float | None = None,
) -> dict[str, Any]:
    return {
        "event_type": "escalation",
        "smb_id": smb_id,
        "smb_name": smb_name,
        "reason": reason,
        "requested_amount": requested_amount,
        "credit_score": credit_score,
        "urgency": "high",
    }


def decision_event(
    smb_id: str,
    smb_name: str,
    action: str,
    amount: int | None = None,
    notification_text: str = "",
) -> dict[str, Any]:
    return {
        "event_type": "decision",
        "smb_id": smb_id,
        "smb_name": smb_name,
        "action": action,
        "amount": amount,
        "notification_text": notification_text,
    }
