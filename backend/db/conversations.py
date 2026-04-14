"""Conversation history stored in SQLite."""
from __future__ import annotations

from typing import Any

from sqlalchemy import select

from backend.db.database import Conversation, async_session


async def save_message(smb_id: str, role: str, content: str) -> None:
    async with async_session() as session:
        session.add(Conversation(smb_id=smb_id, role=role, content=content))
        await session.commit()


async def get_history(smb_id: str, limit: int = 10) -> list[dict[str, Any]]:
    async with async_session() as session:
        result = await session.execute(
            select(Conversation)
            .where(Conversation.smb_id == smb_id)
            .order_by(Conversation.created_at.desc())
            .limit(limit)
        )
        rows = result.scalars().all()
    return [{"role": r.role, "content": r.content} for r in reversed(rows)]
