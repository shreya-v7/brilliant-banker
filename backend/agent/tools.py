from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select

from backend.db.database import Banker, Lead, SMB, async_session
from backend.db.lead_utils import normalize_demo_leads
from backend.models.schemas import (
    CashFlowForecast,
    CreditFactor,
    CreditPrequalResult,
    EscalationResult,
    FAQResult,
    RMContact,
)

logger = logging.getLogger(__name__)

# Demo SMB: Maya Patel (floral) — Pittsburgh skit; tied to seeded declined lead in Activity.
MAYA_SMB_ID = "11111111-1111-1111-1111-111111111111"
# Priya Rao (dry cleaning) — second walkthrough SMB; equipment / cash-flow story.
PRIYA_SMB_ID = "22222222-2222-2222-2222-222222222222"

# Instant pre-qual must decline typical line requests for walkthrough cast (demo narrative).
WALKTHROUGH_CREDIT_DENY_MIN = 3_000

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
        "answer": "You can deposit checks using the PNC mobile app  - just take a photo of the front and back. Deposits before 10 PM ET are usually available next business day.",
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
    from backend.db.database import Transaction

    async with async_session() as session:
        result = await session.execute(
            select(SMB).where(SMB.id == smb_id)
        )
        smb = result.scalar_one_or_none()

        if not smb:
            return {"error": f"SMB {smb_id} not found"}

        cutoff = datetime.now() - timedelta(days=30)
        txn_result = await session.execute(
            select(Transaction)
            .where(Transaction.smb_id == smb_id)
            .where(Transaction.txn_date >= cutoff)
        )
        recent_txns = txn_result.scalars().all()

    monthly_rev = smb.avg_monthly_revenue
    stability = smb.cash_stability

    if recent_txns:
        actual_income = sum(t.amount for t in recent_txns if t.amount > 0)
        actual_expenses = abs(sum(t.amount for t in recent_txns if t.amount < 0))
        projected_revenue = int(actual_income * (0.85 + stability * 0.15))
        projected_expenses = int(actual_expenses * 1.02)
    else:
        projected_revenue = int(monthly_rev * (0.85 + stability * 0.15))
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
            select(SMB).where(SMB.id == smb_id)
        )
        smb = result.scalar_one_or_none()

    if not smb:
        return {"error": f"SMB {smb_id} not found"}

    # Individual factor scores with thresholds
    cash_stability_score = smb.cash_stability
    payment_history_score = smb.payment_history
    revenue_factor = min(smb.avg_monthly_revenue / 100_000, 1.0)

    cash_weight, payment_weight, revenue_weight = 0.35, 0.40, 0.25
    cash_threshold, payment_threshold, revenue_threshold = 0.50, 0.70, 0.30

    composite_score = (
        cash_stability_score * cash_weight
        + payment_history_score * payment_weight
        + revenue_factor * revenue_weight
    )

    max_amount = int(smb.avg_monthly_revenue * 1.5 * composite_score)
    eligible = composite_score >= 0.55 and requested_amount <= max_amount

    factors = [
        CreditFactor(
            name="Cash Stability",
            score=round(cash_stability_score, 2),
            weight=cash_weight,
            weighted_score=round(cash_stability_score * cash_weight, 3),
            threshold=cash_threshold,
            passed=cash_stability_score >= cash_threshold,
            detail=f"{'Stable' if cash_stability_score >= 0.7 else 'Moderate' if cash_stability_score >= 0.5 else 'Volatile'} cash flow pattern over trailing 12 months",
        ),
        CreditFactor(
            name="Payment History",
            score=round(payment_history_score, 2),
            weight=payment_weight,
            weighted_score=round(payment_history_score * payment_weight, 3),
            threshold=payment_threshold,
            passed=payment_history_score >= payment_threshold,
            detail=f"{int(payment_history_score * 100)}% on-time payments  - {'strong' if payment_history_score >= 0.85 else 'adequate' if payment_history_score >= 0.7 else 'needs improvement'}",
        ),
        CreditFactor(
            name="Revenue Capacity",
            score=round(revenue_factor, 2),
            weight=revenue_weight,
            weighted_score=round(revenue_factor * revenue_weight, 3),
            threshold=revenue_threshold,
            passed=revenue_factor >= revenue_threshold,
            detail=f"Monthly revenue {'supports' if revenue_factor >= 0.5 else 'marginally covers' if revenue_factor >= 0.3 else 'insufficient for'} requested debt service",
        ),
    ]

    decline_reasons = []
    if not eligible:
        if composite_score < 0.55:
            for f in factors:
                if not f.passed:
                    decline_reasons.append(f"{f.name}: scored {f.score:.0%}, required {f.threshold:.0%}. {f.detail}.")
            if not decline_reasons:
                decline_reasons.append(
                    f"Combined score of {composite_score:.2f} is below the 0.55 minimum threshold."
                )
        if requested_amount > max_amount:
            decline_reasons.append(
                f"Requested ${requested_amount:,} exceeds pre-qualified maximum of ${max_amount:,} "
                f"(based on average monthly revenue × 1.5 × composite score, same as this demo calculator)."
            )

    if eligible:
        reason = (
            f"Pre-qualified. Composite score {composite_score:.2f} (threshold: 0.55). "
            f"Max approved amount: ${max_amount:,}."
        )
    else:
        reason = " ".join(decline_reasons)

    prequal = CreditPrequalResult(
        eligible=eligible,
        probability=round(composite_score, 2),
        max_amount=max_amount,
        reason=reason,
        requested_amount=requested_amount,
        factors=factors,
        decline_reasons=decline_reasons,
    )
    out = prequal.model_dump()

    # Walkthrough SMBs: profiles can score well on paper, but instant pre-qual declines typical line
    # requests with bank-plausible reasons; RM follow-up carries the real conversation (see graph).
    if smb_id == MAYA_SMB_ID and requested_amount >= WALKTHROUGH_CREDIT_DENY_MIN:
        maya_decline = [
            (
                "Seasonal stress test: modeled January–February debt service coverage is about 1.09x, "
                "below our 1.15x floor for new credit at this request size."
            ),
            (
                "Floral revenue in the slow window runs well below your trailing-twelve average, "
                "so the automated pre-qual cannot approve this structure right now."
            ),
        ]
        out["eligible"] = False
        out["decline_reasons"] = maya_decline
        out["reason"] = " ".join(maya_decline)
        out["max_amount"] = min(out.get("max_amount", 0), 12_000)
        out["prior_underwriting_decision"] = (
            "Activity already has underwriting's final letter on your $28,000 seasonal line request "
            "(same seasonal stress story); use that letter for the full detail."
        )
        out["walkthrough_credit_denial"] = True

    if smb_id == PRIYA_SMB_ID and requested_amount >= WALKTHROUGH_CREDIT_DENY_MIN:
        priya_decline = [
            (
                "Equipment and layering risk: the recent commercial press purchase is still rolling "
                "through your cash flow; adding a new unsecured line at this size would push modeled "
                "coverage below policy for same-store dry cleaning deposits before we see a full quarter "
                "of stabilized activity after that spend."
            ),
            (
                "Week-to-week revenue swings (rush vs. slow periods) mean the automated check cannot "
                "approve this structure without a Relationship Manager review of recent statements, "
                "payroll timing, and how the new equipment affects your borrowing headroom."
            ),
        ]
        out["eligible"] = False
        out["decline_reasons"] = priya_decline
        out["reason"] = " ".join(priya_decline)
        out["max_amount"] = min(out.get("max_amount", 0), 10_000)
        out["walkthrough_credit_denial"] = True

    return out


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


def _make_ticket_number(lead_id: str) -> str:
    """Generate a human-readable ticket number from the lead UUID."""
    hex_part = lead_id.replace("-", "")[:6].upper()
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

    await normalize_demo_leads()

    async with async_session() as session:
        smb_result = await session.execute(select(SMB).where(SMB.id == smb_id))
        smb = smb_result.scalar_one_or_none()
        assigned_banker = None
        if smb and smb.assigned_banker_id:
            banker_result = await session.execute(
                select(Banker).where(Banker.id == smb.assigned_banker_id)
            )
            assigned_banker = banker_result.scalar_one_or_none()
        if assigned_banker is None:
            banker_result = await session.execute(
                select(Banker).order_by(Banker.name).limit(1)
            )
            assigned_banker = banker_result.scalar_one_or_none()
        banker_id = assigned_banker.id if assigned_banker else None

        existing = await session.execute(
            select(Lead)
            .where(Lead.smb_id == smb_id, Lead.status == "pending")
            .order_by(Lead.created_at.desc())
            .limit(1)
        )
        lead = existing.scalar_one_or_none()

        if lead:
            lead.reason = reason
            lead.requested_amount = requested_amount
            lead.credit_score = credit_score
            lead.urgency_score = urgency_score
            if lead.assigned_banker_id is None and banker_id:
                lead.assigned_banker_id = banker_id
            await session.commit()
            await session.refresh(lead)
        else:
            lead = Lead(
                smb_id=smb_id,
                assigned_banker_id=banker_id,
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
