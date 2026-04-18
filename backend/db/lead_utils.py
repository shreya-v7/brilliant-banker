"""Lead maintenance for demo: collapse duplicate pending rows from repeated walkthrough runs."""
from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import delete, select

from backend.db.database import Lead, LeadEvent, async_session

logger = logging.getLogger(__name__)


async def collapse_duplicate_pending_leads() -> int:
    """
    Keep the newest pending lead per smb_id; delete older pending rows and their events.
    Returns number of leads removed.
    """
    removed = 0
    async with async_session() as session:
        result = await session.execute(select(Lead).where(Lead.status == "pending"))
        pending = list(result.scalars().all())
        by_smb: dict[str, list[Lead]] = {}
        for lead in pending:
            by_smb.setdefault(lead.smb_id, []).append(lead)

        for rows in by_smb.values():
            if len(rows) <= 1:
                continue
            rows.sort(
                key=lambda x: x.created_at if x.created_at is not None else datetime.min,
                reverse=True,
            )
            for old in rows[1:]:
                await session.execute(delete(LeadEvent).where(LeadEvent.lead_id == old.id))
                await session.delete(old)
                removed += 1

        if removed:
            await session.commit()
            logger.info("Removed %d duplicate pending lead(s)", removed)
        else:
            await session.commit()

    return removed
