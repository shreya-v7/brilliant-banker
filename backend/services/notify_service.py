from __future__ import annotations

import logging

from backend.agent.prompts import APPROVE_NOTIFY_PROMPT, DECLINE_NOTIFY_PROMPT, REFER_NOTIFY_PROMPT
from backend.services.claude_service import call_claude

logger = logging.getLogger(__name__)


async def draft_decision_notification(
    action: str,
    smb_name: str,
    amount: int | None = None,
    reason: str = "",
) -> str:
    """Draft a decision notification via Claude. Returns the notification text."""

    if action == "approved":
        prompt = APPROVE_NOTIFY_PROMPT.format(smb_name=smb_name, amount=amount or 0)
    elif action == "declined":
        prompt = DECLINE_NOTIFY_PROMPT.format(smb_name=smb_name, reason=reason or "general review")
    elif action == "referred":
        prompt = REFER_NOTIFY_PROMPT.format(smb_name=smb_name)
    else:
        prompt = f"Draft a brief notification for {smb_name} about their banking request status."

    text = await call_claude(
        system="You draft short, warm in-app notifications for a bank. Max 2 sentences. No emoji. No jargon.",
        user_message=prompt,
        max_tokens=150,
    )

    logger.info("Decision notification for %s (%s): %s", smb_name, action, text)
    return text
