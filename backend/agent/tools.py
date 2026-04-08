from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from backend.db.postgres import Banker, Lead, SMB, async_session
from backend.models.schemas import (
    CashFlowForecast,
    CreditPrequalResult,
    EscalationResult,
    FAQResult,
    RMContact,
)

logger = logging.getLogger(__name__)

FAQ_ENTRIES = [
    {
        "keywords": ["hours", "open", "branch", "when"],
        "question": "What are your branch hours?",
        "answer": "Our branches are open Monday-Friday 9 AM to 5 PM, and Saturday 9 AM to 1 PM. You can also bank 24/7 through our app or this SMS line.",
    },
    {
        "keywords": ["fee", "fees", "charge", "cost", "monthly"],
        "question": "What fees does my business account have?",
        "answer": "PNC business checking has no monthly fee if you maintain a $500 minimum balance. Wire transfers are $25 domestic, $40 international.",
    },
    {
        "keywords": ["deposit", "check", "mobile"],
        "question": "How do I deposit a check?",
        "answer": "You can deposit checks using the PNC mobile app — just take a photo of the front and back. Deposits before 10 PM ET are usually available next business day.",
    },
    {
        "keywords": ["wire", "transfer", "send", "money"],
        "question": "How do I send a wire transfer?",
        "answer": "You can initiate wire transfers through online banking or by calling your banker. Domestic wires typically arrive same day if submitted before 3 PM ET.",
    },
    {
        "keywords": ["loan", "interest", "rate", "rates", "apr"],
        "question": "What are your current business loan rates?",
        "answer": "Business loan rates vary by credit profile and loan type. Current SBA loans start at Prime + 2.75%. I can loop in your Relationship Manager for a personalized quote.",
    },
    {
        "keywords": ["password", "login", "reset", "account", "locked"],
        "question": "How do I reset my online banking password?",
        "answer": "You can reset your password at pnc.com by clicking 'Forgot Password' on the login page, or call us at 1-888-PNC-BANK for help.",
    },
    {
        "keywords": ["statement", "statements", "download", "history"],
        "question": "How do I get my account statements?",
        "answer": "Statements are available in online banking under Documents. You can view the last 7 years of statements and download them as PDFs.",
    },
]


async def get_cash_flow_forecast(smb_id: str) -> dict[str, Any]:
    from datetime import datetime, timedelta
    from backend.db.postgres import Transaction

    async with async_session() as session:
        result = await session.execute(
            select(SMB).where(SMB.id == uuid.UUID(smb_id))
        )
        smb = result.scalar_one_or_none()

        if not smb:
            return {"error": f"SMB {smb_id} not found"}

        cutoff = datetime.now() - timedelta(days=30)
        txn_result = await session.execute(
            select(Transaction)
            .where(Transaction.smb_id == uuid.UUID(smb_id))
            .where(Transaction.txn_date >= cutoff)
        )
        recent_txns = txn_result.scalars().all()

    monthly_rev = smb.avg_monthly_revenue
    stability = smb.cash_stability

    if recent_txns:
        actual_income = sum(t.amount for t in recent_txns if t.amount > 0)
        actual_expenses = abs(sum(t.amount for t in recent_txns if t.amount < 0))
        projected_revenue = int(actual_income * stability)
        projected_expenses = int(actual_expenses * 1.05)
    else:
        projected_revenue = int(monthly_rev * stability)
        projected_expenses = int(monthly_rev * 0.72)

    projected_net = projected_revenue - projected_expenses
    risk = "low" if stability > 0.7 else ("medium" if stability > 0.5 else "high")

    forecast = CashFlowForecast(
        smb_id=smb_id,
        smb_name=smb.name,
        business_type=smb.business_type,
        avg_monthly_revenue=monthly_rev,
        cash_stability=stability,
        projected_30_day_revenue=projected_revenue,
        projected_30_day_expenses=projected_expenses,
        projected_net=projected_net,
        risk_flag=risk,
    )
    return forecast.model_dump()


async def check_credit_prequal(smb_id: str, requested_amount: int = 50000) -> dict[str, Any]:
    async with async_session() as session:
        result = await session.execute(
            select(SMB).where(SMB.id == uuid.UUID(smb_id))
        )
        smb = result.scalar_one_or_none()

    if not smb:
        return {"error": f"SMB {smb_id} not found"}

    score = (
        smb.cash_stability * 0.35
        + smb.payment_history * 0.40
        + min(smb.avg_monthly_revenue / 100_000, 1.0) * 0.25
    )

    max_amount = int(smb.avg_monthly_revenue * 3 * score)
    eligible = score >= 0.55 and requested_amount <= max_amount

    if not eligible:
        if score < 0.55:
            reason = (
                f"Combined credit score of {score:.2f} is below the 0.55 threshold. "
                f"Cash stability ({smb.cash_stability}) and payment history "
                f"({smb.payment_history}) need improvement."
            )
        else:
            reason = (
                f"Requested ${requested_amount:,} exceeds max pre-qualified amount of "
                f"${max_amount:,} based on revenue and credit profile."
            )
    else:
        reason = (
            f"Strong profile: cash stability {smb.cash_stability}, "
            f"payment history {smb.payment_history}, "
            f"avg monthly revenue ${smb.avg_monthly_revenue:,}."
        )

    prequal = CreditPrequalResult(
        eligible=eligible,
        probability=round(score, 2),
        max_amount=max_amount,
        reason=reason,
        requested_amount=requested_amount,
    )
    return prequal.model_dump()


async def search_faq(query: str) -> dict[str, Any]:
    query_lower = query.lower()
    best_match = None
    best_score = 0

    for entry in FAQ_ENTRIES:
        score = sum(1 for kw in entry["keywords"] if kw in query_lower)
        if score > best_score:
            best_score = score
            best_match = entry

    if best_match and best_score > 0:
        confidence = min(best_score / 3.0, 1.0)
        faq = FAQResult(
            question=best_match["question"],
            answer=best_match["answer"],
            confidence=round(confidence, 2),
        )
        return faq.model_dump()

    return FAQResult(
        question=query,
        answer="I don't have a specific answer for that. Would you like me to create a ticket for your Relationship Manager?",
        confidence=0.0,
    ).model_dump()


def _make_ticket_number(lead_id: uuid.UUID) -> str:
    """Generate a human-readable ticket number from the lead UUID."""
    hex_part = str(lead_id).replace("-", "")[:6].upper()
    return f"TKT-{hex_part}"


async def escalate_to_banker(
    smb_id: str,
    reason: str,
    urgency: str = "medium",
    requested_amount: int | None = None,
    credit_score: float | None = None,
) -> dict[str, Any]:
    urgency_scores = {"low": 0.3, "medium": 0.6, "high": 0.9}
    urgency_score = urgency_scores.get(urgency, 0.6)

    async with async_session() as session:
        # Assign an RM (round-robin by least leads, or first available)
        banker_result = await session.execute(
            select(Banker).order_by(Banker.name).limit(1)
        )
        assigned_banker = banker_result.scalar_one_or_none()

        lead = Lead(
            smb_id=uuid.UUID(smb_id),
            assigned_banker_id=assigned_banker.id if assigned_banker else None,
            status="pending",
            urgency_score=urgency_score,
            reason=reason,
            requested_amount=requested_amount,
            credit_score=credit_score,
        )
        session.add(lead)
        await session.commit()
        await session.refresh(lead)

    ticket_number = _make_ticket_number(lead.id)

    rm_contact = None
    if assigned_banker:
        rm_contact = RMContact(
            name=assigned_banker.name,
            title=assigned_banker.title,
            email=assigned_banker.email,
            region=assigned_banker.region,
        )

    result = EscalationResult(
        lead_id=str(lead.id),
        ticket_number=ticket_number,
        smb_id=smb_id,
        reason=reason,
        urgency=urgency,
        status="pending",
        assigned_rm=rm_contact,
    )
    logger.info(
        "Ticket %s created: lead_id=%s smb_id=%s RM=%s amount=%s",
        ticket_number, lead.id, smb_id,
        assigned_banker.name if assigned_banker else "unassigned",
        requested_amount,
    )
    return result.model_dump()
