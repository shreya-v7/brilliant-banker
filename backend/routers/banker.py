from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import Lead, LeadEvent, SMB, Banker, BankerNote, get_session
from backend.models.schemas import (
    DecisionRequest,
    DecisionResponse,
    LeadOut,
    PortfolioOut,
    PortfolioSMB,
    BankerNoteOut,
    BankerNoteRequest,
)


def _compute_credit_factors(smb: SMB, requested_amount: int | None = None) -> tuple[list[dict], list[str]]:
    """Compute transparent credit scoring factors from SMB profile."""
    cash_stability_score = smb.cash_stability
    payment_history_score = smb.payment_history
    revenue_factor = min(smb.avg_monthly_revenue / 100_000, 1.0)

    cash_weight, payment_weight, revenue_weight = 0.35, 0.40, 0.25
    cash_threshold, payment_threshold, revenue_threshold = 0.50, 0.70, 0.30

    composite = (
        cash_stability_score * cash_weight
        + payment_history_score * payment_weight
        + revenue_factor * revenue_weight
    )
    max_amount = int(smb.avg_monthly_revenue * 3 * composite)

    factors = [
        {
            "name": "Cash Stability",
            "score": round(cash_stability_score, 2),
            "weight": cash_weight,
            "weighted_score": round(cash_stability_score * cash_weight, 3),
            "threshold": cash_threshold,
            "passed": cash_stability_score >= cash_threshold,
            "detail": (
                f"{'Stable' if cash_stability_score >= 0.7 else 'Moderate' if cash_stability_score >= 0.5 else 'Volatile'} "
                f"cash flow pattern over trailing 12 months"
            ),
        },
        {
            "name": "Payment History",
            "score": round(payment_history_score, 2),
            "weight": payment_weight,
            "weighted_score": round(payment_history_score * payment_weight, 3),
            "threshold": payment_threshold,
            "passed": payment_history_score >= payment_threshold,
            "detail": (
                f"{int(payment_history_score * 100)}% on-time payments  - "
                f"{'strong' if payment_history_score >= 0.85 else 'adequate' if payment_history_score >= 0.7 else 'needs improvement'}"
            ),
        },
        {
            "name": "Revenue Capacity",
            "score": round(revenue_factor, 2),
            "weight": revenue_weight,
            "weighted_score": round(revenue_factor * revenue_weight, 3),
            "threshold": revenue_threshold,
            "passed": revenue_factor >= revenue_threshold,
            "detail": (
                f"Monthly revenue {'supports' if revenue_factor >= 0.5 else 'marginally covers' if revenue_factor >= 0.3 else 'insufficient for'} "
                f"requested debt service"
            ),
        },
    ]

    decline_reasons = []
    if composite < 0.55:
        for f in factors:
            if not f["passed"]:
                decline_reasons.append(
                    f"{f['name']}: scored {f['score']:.0%}, required {f['threshold']:.0%}. {f['detail']}."
                )
    if requested_amount and requested_amount > max_amount:
        decline_reasons.append(
            f"Requested ${requested_amount:,} exceeds pre-qualified maximum of ${max_amount:,}."
        )

    return factors, decline_reasons
from backend.services.notify_service import draft_decision_notification
from backend.services.stream_service import publish_event, decision_event

router = APIRouter(prefix="/banker", tags=["banker"])


@router.get("/portfolio", response_model=PortfolioOut)
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


@router.get("/leads", response_model=list[LeadOut])
async def list_leads(
    status: Optional[str] = Query(None),
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

        factors, decline_reasons = [], []
        if smb:
            factors, decline_reasons = _compute_credit_factors(smb, lead.requested_amount)

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
                factors=factors,
                decline_reasons=decline_reasons,
            )
        )
    return out


@router.post("/leads/{lead_id}/decision", response_model=DecisionResponse)
async def create_decision(
    lead_id: str,
    body: DecisionRequest,
    banker_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Lead).where(Lead.id == lead_id)
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
        banker_id=banker_id or "banker-demo-001",
    )
    session.add(event)
    lead.status = body.action

    # For declines, include transparent scoring reasons
    decision_reason = lead.reason or body.banker_note
    if body.action == "declined":
        _, decline_reasons = _compute_credit_factors(smb, lead.requested_amount)
        if decline_reasons:
            decision_reason = " | ".join(decline_reasons)

    try:
        notification_text = await draft_decision_notification(
            action=body.action,
            smb_name=smb.name,
            amount=body.amount,
            reason=decision_reason,
        )
    except Exception:
        action_word = {"approved": "approved", "declined": "declined"}.get(body.action, "referred")
        notification_text = f"Your credit request has been {action_word}. Your Relationship Manager will follow up with details."

    event.sms_sent = notification_text
    await session.commit()

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


@router.get("/smb/{smb_id}/notes", response_model=list[BankerNoteOut])
async def get_notes(
    smb_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(BankerNote)
        .where(BankerNote.smb_id == smb_id)
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


@router.post("/smb/{smb_id}/notes", response_model=BankerNoteOut)
async def add_note(
    smb_id: str,
    body: BankerNoteRequest,
    banker_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    smb_result = await session.execute(select(SMB).where(SMB.id == smb_id))
    if not smb_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="SMB not found")

    resolved_banker_id = None
    banker_name = "Banker"
    if banker_id:
        try:
            b_result = await session.execute(select(Banker).where(Banker.id == banker_id))
            banker = b_result.scalar_one_or_none()
            if banker:
                resolved_banker_id = banker.id
                banker_name = banker.name
        except Exception:
            pass

    note = BankerNote(
        smb_id=smb_id,
        banker_id=resolved_banker_id or "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
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
