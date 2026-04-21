"""Lead maintenance for demo: dedupe rows and events from repeated walkthrough runs."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Sequence

from sqlalchemy import delete, select

from backend.db.database import Lead, LeadEvent, async_session

logger = logging.getLogger(__name__)

TERMINAL_STATUSES = ("approved", "declined", "referred")


def _created_at_key(x: Lead | LeadEvent) -> datetime:
    return x.created_at if x.created_at is not None else datetime.min


def _amount_bucket(amount: int | None) -> str:
    return "none" if amount is None else str(amount)


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
            rows.sort(key=_created_at_key, reverse=True)
            for old in rows[1:]:
                await session.execute(delete(LeadEvent).where(LeadEvent.lead_id == old.id))
                await session.delete(old)
                removed += 1

        await session.commit()
        if removed:
            logger.info("Removed %d duplicate pending lead(s)", removed)

    return removed


async def collapse_duplicate_terminal_leads() -> int:
    """
    For each (smb_id, status, requested_amount), keep the newest terminal lead;
    delete older duplicates and their events. Does not merge different amounts.
    """
    removed = 0
    async with async_session() as session:
        result = await session.execute(select(Lead).where(Lead.status.in_(TERMINAL_STATUSES)))
        leads = list(result.scalars().all())
        groups: dict[tuple[str, str, str], list[Lead]] = {}
        for lead in leads:
            key = (lead.smb_id, lead.status, _amount_bucket(lead.requested_amount))
            groups.setdefault(key, []).append(lead)

        for rows in groups.values():
            if len(rows) <= 1:
                continue
            rows.sort(key=_created_at_key, reverse=True)
            for old in rows[1:]:
                await session.execute(delete(LeadEvent).where(LeadEvent.lead_id == old.id))
                await session.delete(old)
                removed += 1

        await session.commit()
        if removed:
            logger.info("Removed %d duplicate terminal lead(s)", removed)

    return removed


async def collapse_duplicate_lead_events() -> int:
    """
    Keep the newest LeadEvent per (lead_id, action); delete older (e.g. double-submit).
    """
    removed = 0
    async with async_session() as session:
        result = await session.execute(select(LeadEvent))
        events = list(result.scalars().all())
        groups: dict[tuple[str, str], list[LeadEvent]] = {}
        for ev in events:
            key = (ev.lead_id, ev.action)
            groups.setdefault(key, []).append(ev)

        for rows in groups.values():
            if len(rows) <= 1:
                continue
            rows.sort(key=_created_at_key, reverse=True)
            for old in rows[1:]:
                await session.delete(old)
                removed += 1

        await session.commit()
        if removed:
            logger.info("Removed %d duplicate lead event(s)", removed)

    return removed


async def normalize_demo_leads() -> dict[str, Any]:
    """Run all dedupe passes; safe to call often (e.g. before escalation, on startup)."""
    pending = await collapse_duplicate_pending_leads()
    terminal = await collapse_duplicate_terminal_leads()
    events = await collapse_duplicate_lead_events()
    return {"pending_removed": pending, "terminal_removed": terminal, "events_removed": events}


async def delete_pending_leads_for_smbs(smb_ids: Sequence[str]) -> int:
    """
    Remove pending leads (and their events) for the given SMB ids.
    Used to reset the RM priority queue between walkthrough runs without touching
    terminal/seeded history rows.
    """
    if not smb_ids:
        return 0
    removed = 0
    async with async_session() as session:
        result = await session.execute(
            select(Lead).where(Lead.smb_id.in_(smb_ids), Lead.status == "pending")
        )
        for lead in result.scalars().all():
            await session.execute(delete(LeadEvent).where(LeadEvent.lead_id == lead.id))
            await session.delete(lead)
            removed += 1
        await session.commit()
        if removed:
            logger.info("Deleted %d pending lead(s) for smb_ids=%s", removed, smb_ids)
    return removed
