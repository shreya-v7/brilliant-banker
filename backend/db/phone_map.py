"""
In-memory key-value store replacing Redis.
For a POC this is all we need  - no external service required.
"""
from __future__ import annotations

_store: dict[str, str] = {}


async def phone_to_smb_id(phone: str) -> str | None:
    return _store.get(f"phone:{phone}")


async def set_phone_mapping(phone: str, smb_id: str) -> None:
    _store[f"phone:{phone}"] = smb_id


async def get_all_phone_mappings() -> dict[str, str]:
    return {
        k.removeprefix("phone:"): v
        for k, v in _store.items()
        if k.startswith("phone:")
    }
