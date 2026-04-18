"""Sanitize untrusted user text before it is passed to tools or LLM prompts."""
from __future__ import annotations

import unicodedata

# Aligned with ChatRequest max_length in routers/chat.py
MAX_CHAT_MESSAGE_LEN = 2000


def sanitize_user_text(text: str, max_len: int = MAX_CHAT_MESSAGE_LEN) -> str:
    """
    Normalize and strip control / non-printable characters; cap length.
    Returns a safe non-empty string for downstream use.
    """
    if not isinstance(text, str):
        text = str(text)
    text = unicodedata.normalize("NFC", text)
    out: list[str] = []
    for ch in text:
        if ch.isprintable() or ch in "\n\r\t":
            out.append(ch)
    text = "".join(out)
    if len(text) > max_len:
        text = text[:max_len]
    text = text.strip()
    return text if text else "."


def sanitize_history(history: list[dict] | None, tail: int = 10) -> list[dict[str, str]]:
    """Return a shallow copy with sanitized message contents (role preserved)."""
    if not history:
        return []
    safe: list[dict[str, str]] = []
    for m in history[-tail:]:
        role = m.get("role", "user")
        if role not in ("user", "assistant"):
            role = "user"
        content = sanitize_user_text(str(m.get("content", "")))
        safe.append({"role": role, "content": content})
    return safe
