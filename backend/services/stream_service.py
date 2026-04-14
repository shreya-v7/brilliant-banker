"""
Real-time event stream via Redis pub/sub (Kafka-equivalent for the prototype).

Publishers  : chat endpoint, escalation tool, decision endpoint
Subscribers : SSE endpoint consumed by the RM dashboard

Channel: "rm:events"
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

import redis.asyncio as aioredis

from backend.models.schemas import Settings

logger = logging.getLogger(__name__)
settings = Settings()

CHANNEL = "rm:events"


def _redis_conn() -> aioredis.Redis:
    kwargs: dict = {"decode_responses": True}
    if settings.REDIS_URL.startswith("rediss://"):
        kwargs["ssl_cert_reqs"] = "none"
    return aioredis.from_url(settings.REDIS_URL, **kwargs)


async def publish_event(event: dict[str, Any]) -> None:
    """Publish a structured event to the RM stream."""
    r = _redis_conn()
    try:
        event.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        payload = json.dumps(event, default=str)
        await r.publish(CHANNEL, payload)
        logger.info("Stream event published: %s [%s]", event.get("event_type"), event.get("smb_name", ""))
    finally:
        await r.aclose()


async def subscribe_events() -> AsyncGenerator[dict[str, Any], None]:
    """Subscribe to the RM event stream. Yields parsed event dicts."""
    r = _redis_conn()
    pubsub = r.pubsub()
    try:
        await pubsub.subscribe(CHANNEL)
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    yield json.loads(message["data"])
                except json.JSONDecodeError:
                    continue
    finally:
        await pubsub.unsubscribe(CHANNEL)
        await pubsub.aclose()
        await r.aclose()


# ── Pre-built event constructors ──────────────────────────────────────────────

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
) -> dict[str, Any]:
    event = {
        "event_type": "chat_highlight",
        "smb_id": smb_id,
        "smb_name": smb_name,
        "intent": intent,
        "highlight": highlight,
        "escalated": escalated,
        "urgency": urgency,
        "requested_amount": requested_amount,
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
