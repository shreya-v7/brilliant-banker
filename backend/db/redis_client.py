from __future__ import annotations

import redis.asyncio as aioredis

from backend.models.schemas import Settings

settings = Settings()

_redis_kwargs: dict = {"decode_responses": True}
if settings.REDIS_URL.startswith("rediss://"):
    import ssl as _ssl
    _ctx = _ssl.create_default_context()
    _ctx.check_hostname = False
    _ctx.verify_mode = _ssl.CERT_NONE
    _redis_kwargs["ssl"] = True
    _redis_kwargs["ssl_cert_reqs"] = "none"

pool = aioredis.ConnectionPool.from_url(settings.REDIS_URL, **_redis_kwargs)


def get_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=pool)


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
