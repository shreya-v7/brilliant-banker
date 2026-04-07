from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.postgres import Lead, LeadEvent, SMB, get_session
from backend.models.schemas import DecisionRequest, DecisionResponse, LeadOut
from backend.services.notify_service import draft_decision_notification

router = APIRouter(prefix="/banker", tags=["banker"])


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
        out.append(
            LeadOut(
                id=lead.id,
                smb_id=lead.smb_id,
                smb_name=smb.name if smb else None,
                business_type=smb.business_type if smb else None,
                status=lead.status,
                requested_amount=lead.requested_amount,
                credit_score=lead.credit_score,
                urgency_score=lead.urgency_score,
                reason=lead.reason,
                created_at=lead.created_at,
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

    event = LeadEvent(
        lead_id=lead.id,
        action=body.action,
        amount=body.amount,
        banker_note=body.banker_note,
        banker_id="banker-demo-001",
    )
    session.add(event)

    notification_text = await draft_decision_notification(
        action=body.action,
        smb_name=smb.name,
        amount=body.amount,
        reason=lead.reason or body.banker_note,
    )

    event.sms_sent = notification_text
    await session.commit()

    return DecisionResponse(
        lead_id=str(lead.id),
        action=body.action,
        notification_text=notification_text,
    )
