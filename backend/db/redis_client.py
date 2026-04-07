from __future__ import annotations

import redis.asyncio as redis

from backend.models.schemas import Settings

settings = Settings()

pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=pool)


async def phone_to_smb_id(phone: str) -> str | None:
    r = get_redis()
    return await r.get(f"phone:{phone}")


async def set_phone_mapping(phone: str, smb_id: str) -> None:
    r = get_redis()
    await r.set(f"phone:{phone}", smb_id)


async def get_all_phone_mappings() -> dict[str, str]:
    r = get_redis()
    keys = [k async for k in r.scan_iter("phone:*")]
    if not keys:
        return {}
    values = await r.mget(keys)
    return {k.removeprefix("phone:"): v for k, v in zip(keys, values) if v}
