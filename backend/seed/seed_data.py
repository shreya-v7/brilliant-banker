"""
Seed mock SMB data into Postgres and Redis.

Run from project root:
    python -m backend.seed.seed_data
"""

from __future__ import annotations

import asyncio
import logging
import uuid

from sqlalchemy import select

from backend.db.postgres import Base, SMB, engine, async_session, init_db
from backend.db.redis_client import set_phone_mapping

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

MOCK_SMBS = [
    {
        "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
        "name": "Anne Fox",
        "business_type": "Floral design",
        "annual_revenue": 1_200_000,
        "avg_monthly_revenue": 98_000,
        "cash_stability": 0.72,
        "payment_history": 0.88,
        "phone": "+14151110001",
    },
    {
        "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
        "name": "Justin Strong",
        "business_type": "Dry cleaning",
        "annual_revenue": 532_000,
        "avg_monthly_revenue": 44_000,
        "cash_stability": 0.61,
        "payment_history": 0.79,
        "phone": "+14151110002",
    },
    {
        "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
        "name": "Melissa Murphy",
        "business_type": "Restaurant",
        "annual_revenue": 680_000,
        "avg_monthly_revenue": 56_000,
        "cash_stability": 0.45,
        "payment_history": 0.82,
        "phone": "+14151110003",
    },
    {
        "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
        "name": "Valentina Cruz",
        "business_type": "Bike tourism",
        "annual_revenue": 490_000,
        "avg_monthly_revenue": 41_000,
        "cash_stability": 0.38,
        "payment_history": 0.75,
        "phone": "+14151110004",
    },
    {
        "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
        "name": "Richard Watterson",
        "business_type": "Bookkeeping",
        "annual_revenue": 85_000,
        "avg_monthly_revenue": 7_000,
        "cash_stability": 0.91,
        "payment_history": 0.95,
        "phone": "+14151110005",
    },
]


async def seed():
    logger.info("Initializing database tables...")
    await init_db()

    async with async_session() as session:
        existing = await session.execute(select(SMB.id))
        existing_ids = {row[0] for row in existing.all()}

        added = 0
        for data in MOCK_SMBS:
            if data["id"] in existing_ids:
                logger.info("  Skip (exists): %s", data["name"])
                continue

            smb = SMB(**data)
            session.add(smb)
            added += 1
            logger.info("  Added: %s (%s)", data["name"], data["phone"])

        await session.commit()
        logger.info("Postgres: %d new SMBs seeded (%d already existed)", added, len(MOCK_SMBS) - added)

    logger.info("Seeding Redis phone mappings...")
    for data in MOCK_SMBS:
        await set_phone_mapping(data["phone"], str(data["id"]))
        logger.info("  Redis: %s -> %s", data["phone"], data["id"])

    logger.info("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
