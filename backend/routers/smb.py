from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import SMB, Lead, LeadEvent, Transaction, get_session
from backend.models.schemas import SMBProfile, TransactionOut, SMBLeadOut, RMContact
from backend.services.claude_service import generate_ai_brief

router = APIRouter(tags=["smb"])


@router.get(
    "/smb/{smb_id}/profile",
    response_model=SMBProfile,
    summary="Get SMB profile with AI brief",
)
async def get_smb_profile(
    smb_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(SMB).where(SMB.id == smb_id)
    )
    smb = result.scalar_one_or_none()
    if not smb:
        raise HTTPException(status_code=404, detail="SMB not found")

    try:
        brief = await generate_ai_brief(
            {
                "name": smb.name,
                "business_type": smb.business_type,
                "annual_revenue": smb.annual_revenue,
                "avg_monthly_revenue": smb.avg_monthly_revenue,
                "cash_stability": smb.cash_stability,
                "payment_history": smb.payment_history,
            }
        )
    except Exception:
        brief = None

    return SMBProfile(
        id=smb.id,
        name=smb.name,
        business_type=smb.business_type,
        annual_revenue=smb.annual_revenue,
        avg_monthly_revenue=smb.avg_monthly_revenue,
        cash_stability=smb.cash_stability,
        payment_history=smb.payment_history,
        phone=smb.phone,
        ai_brief=brief,
    )


@router.get(
    "/smb/{smb_id}/transactions",
    response_model=list[TransactionOut],
    summary="Get recent transactions for an SMB",
)
async def get_transactions(
    smb_id: str,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Transaction)
        .where(Transaction.smb_id == smb_id)
        .order_by(Transaction.txn_date.desc())
        .limit(limit)
    )
    txns = result.scalars().all()
    return [
        TransactionOut(
            id=t.id,
            description=t.description,
            amount=t.amount,
            category=t.category,
            txn_date=t.txn_date,
        )
        for t in txns
    ]


@router.get(
    "/smb/{smb_id}/escalations",
    response_model=list[SMBLeadOut],
    summary="Get all escalations (leads) created by this SMB",
)
async def get_smb_escalations(
    smb_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Lead)
        .where(Lead.smb_id == smb_id)
        .order_by(Lead.created_at.desc())
    )
    leads = result.scalars().all()

    out = []
    for lead in leads:
        # Get latest event notification if any
        latest_notification = None
        if lead.events:
            latest_event = sorted(lead.events, key=lambda e: e.created_at or 0, reverse=True)[0]
            latest_notification = latest_event.sms_sent

        rm_contact = None
        if lead.assigned_banker:
            rm_contact = RMContact(
                name=lead.assigned_banker.name,
                title=lead.assigned_banker.title,
                email=lead.assigned_banker.email,
                region=lead.assigned_banker.region,
            )

        hex_part = str(lead.id).replace("-", "")[:6].upper()
        ticket_number = f"TKT-{hex_part}"

        out.append(SMBLeadOut(
            id=lead.id,
            ticket_number=ticket_number,
            status=lead.status,
            requested_amount=lead.requested_amount,
            credit_score=lead.credit_score,
            urgency_score=lead.urgency_score,
            reason=lead.reason,
            created_at=lead.created_at,
            notification_text=latest_notification,
            assigned_rm=rm_contact,
        ))
    return out
