from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from backend.models.schemas import Settings

settings = Settings()

_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _client


def get_db():
    return get_mongo_client()[settings.MONGODB_DB]


async def save_message(smb_id: str, role: str, content: str) -> None:
    db = get_db()
    await db.conversations.insert_one(
        {
            "smb_id": smb_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc),
        }
    )


async def get_history(smb_id: str, limit: int = 10) -> list[dict[str, Any]]:
    db = get_db()
    cursor = (
        db.conversations.find({"smb_id": smb_id}, {"_id": 0, "role": 1, "content": 1})
        .sort("timestamp", -1)
        .limit(limit)
    )
    messages = await cursor.to_list(length=limit)
    return list(reversed(messages))


async def close_mongo() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
