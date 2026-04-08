from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.postgres import Lead, LeadEvent, SMB, Banker, BankerNote, get_session
from backend.models.schemas import (
    DecisionRequest,
    DecisionResponse,
    LeadOut,
    PortfolioOut,
    PortfolioSMB,
    BankerNoteOut,
    BankerNoteRequest,
)
from backend.services.notify_service import draft_decision_notification
from backend.services.stream_service import publish_event, decision_event

router = APIRouter(prefix="/banker", tags=["banker"])


@router.get("/portfolio", response_model=PortfolioOut, summary="Get all SMBs in the portfolio")
async def get_portfolio(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(SMB).order_by(SMB.cash_stability))
    smbs = result.scalars().all()
    return PortfolioOut(
        smbs=[
            PortfolioSMB(
                id=s.id,
                name=s.name,
                business_type=s.business_type,
                annual_revenue=s.annual_revenue,
                avg_monthly_revenue=s.avg_monthly_revenue,
                cash_stability=s.cash_stability,
                payment_history=s.payment_history,
                phone=s.phone,
            )
            for s in smbs
        ]
    )


@router.get("/leads", response_model=list[LeadOut], summary="List all leads")
async def list_leads(
    status: Optional[str] = Query(None, description="Filter by status"),
    session: AsyncSession = Depends(get_session),
):
    query = select(Lead).order_by(Lead.urgency_score.desc())
    if status:
        query = query.where(Lead.status == status)

    result = await session.execute(query)
    leads = result.scalars().all()

    out = []
    for lead in leads:
        smb = lead.smb
        hex_part = str(lead.id).replace("-", "")[:6].upper()
        out.append(
            LeadOut(
                id=lead.id,
                ticket_number=f"TKT-{hex_part}",
                smb_id=lead.smb_id,
                smb_name=smb.name if smb else None,
                business_type=smb.business_type if smb else None,
                status=lead.status,
                requested_amount=lead.requested_amount,
                credit_score=lead.credit_score,
                urgency_score=lead.urgency_score,
                reason=lead.reason,
                created_at=lead.created_at,
                assigned_rm_name=lead.assigned_banker.name if lead.assigned_banker else None,
            )
        )
    return out


@router.post(
    "/leads/{lead_id}/decision",
    response_model=DecisionResponse,
    summary="Record banker decision on a lead",
)
async def create_decision(
    lead_id: str,
    body: DecisionRequest,
    banker_id: Optional[str] = Query(None, description="Banker UUID making the decision"),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Lead).where(Lead.id == uuid.UUID(lead_id))
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    smb = lead.smb
    if not smb:
        raise HTTPException(status_code=404, detail="SMB not found for this lead")

    # Resolve banker name for the event record
    resolved_banker_id = banker_id or "banker-demo-001"

    event = LeadEvent(
        lead_id=lead.id,
        action=body.action,
        amount=body.amount,
        banker_note=body.banker_note,
        banker_id=resolved_banker_id,
    )
    session.add(event)

    # Update lead status
    lead.status = body.action

    try:
        notification_text = await draft_decision_notification(
            action=body.action,
            smb_name=smb.name,
            amount=body.amount,
            reason=lead.reason or body.banker_note,
        )
    except Exception:
        action_word = "approved" if body.action == "approved" else ("declined" if body.action == "declined" else "referred")
        notification_text = f"Your credit request has been {action_word}. Your Relationship Manager will follow up with details."

    event.sms_sent = notification_text
    await session.commit()

    # Publish decision to RM stream
    try:
        await publish_event(decision_event(
            smb_id=str(smb.id),
            smb_name=smb.name,
            action=body.action,
            amount=body.amount,
            notification_text=notification_text,
        ))
    except Exception:
        pass

    return DecisionResponse(
        lead_id=str(lead.id),
        action=body.action,
        notification_text=notification_text,
    )


@router.get(
    "/smb/{smb_id}/notes",
    response_model=list[BankerNoteOut],
    summary="Get banker notes for an SMB",
)
async def get_notes(
    smb_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(BankerNote)
        .where(BankerNote.smb_id == uuid.UUID(smb_id))
        .order_by(BankerNote.created_at.desc())
    )
    notes = result.scalars().all()
    return [
        BankerNoteOut(
            id=n.id,
            note=n.note,
            banker_name=n.banker.name if n.banker else "Banker",
            created_at=n.created_at,
        )
        for n in notes
    ]


@router.post(
    "/smb/{smb_id}/notes",
    response_model=BankerNoteOut,
    summary="Add a banker note for an SMB",
)
async def add_note(
    smb_id: str,
    body: BankerNoteRequest,
    banker_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    # Validate SMB exists
    smb_result = await session.execute(select(SMB).where(SMB.id == uuid.UUID(smb_id)))
    if not smb_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="SMB not found")

    # Resolve banker
    resolved_banker_id = None
    banker_name = "Banker"
    if banker_id:
        try:
            b_result = await session.execute(select(Banker).where(Banker.id == uuid.UUID(banker_id)))
            banker = b_result.scalar_one_or_none()
            if banker:
                resolved_banker_id = banker.id
                banker_name = banker.name
        except Exception:
            pass

    note = BankerNote(
        smb_id=uuid.UUID(smb_id),
        banker_id=resolved_banker_id or uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        note=body.note,
    )
    session.add(note)
    await session.commit()
    await session.refresh(note)

    return BankerNoteOut(
        id=note.id,
        note=note.note,
        banker_name=banker_name,
        created_at=note.created_at,
    )
