from __future__ import annotations

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agent.graph import run_agent
from backend.db.mongo_client import get_history, save_message
from backend.db.postgres import SMB, Banker, get_session, async_session
from backend.models.schemas import BankerOut, BankerLoginRequest, RMContact
from backend.observability.metrics import CHAT_MESSAGES, ESCALATIONS
from backend.services.claude_service import generate_rm_highlight
from backend.services.stream_service import publish_event, chat_highlight_event, escalation_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    smb_id: str
    message: str = Field(..., min_length=1, max_length=2000)


class RMContactOut(BaseModel):
    name: str
    title: str
    email: str

class ChatResponse(BaseModel):
    reply: str
    intent: str
    escalated: bool
    ticket_number: str | None = None
    assigned_rm: RMContactOut | None = None


class LoginRequest(BaseModel):
    smb_id: str


class LoginResponse(BaseModel):
    smb_id: str
    name: str
    business_type: str
    annual_revenue: int
    avg_monthly_revenue: int
    cash_stability: float
    payment_history: float
    phone: str


class HistoryMessage(BaseModel):
    role: str
    content: str


@router.post("/auth/login", response_model=LoginResponse)
async def mock_login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(SMB).where(SMB.id == uuid.UUID(body.smb_id))
    )
    smb = result.scalar_one_or_none()
    if not smb:
        raise HTTPException(status_code=404, detail="SMB not found")

    return LoginResponse(
        smb_id=str(smb.id),
        name=smb.name,
        business_type=smb.business_type,
        annual_revenue=smb.annual_revenue,
        avg_monthly_revenue=smb.avg_monthly_revenue,
        cash_stability=smb.cash_stability,
        payment_history=smb.payment_history,
        phone=smb.phone,
    )


@router.get("/auth/users", response_model=list[LoginResponse])
async def list_users(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(SMB).order_by(SMB.name))
    smbs = result.scalars().all()
    return [
        LoginResponse(
            smb_id=str(s.id),
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


@router.get("/auth/bankers", response_model=list[BankerOut])
async def list_bankers(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Banker).order_by(Banker.name))
    bankers = result.scalars().all()
    return [
        BankerOut(
            banker_id=str(b.id),
            name=b.name,
            title=b.title,
            region=b.region,
            email=b.email,
        )
        for b in bankers
    ]


@router.post("/auth/banker-login", response_model=BankerOut)
async def banker_login(
    body: BankerLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Banker).where(Banker.id == uuid.UUID(body.banker_id))
    )
    banker = result.scalar_one_or_none()
    if not banker:
        raise HTTPException(status_code=404, detail="Banker not found")
    return BankerOut(
        banker_id=str(banker.id),
        name=banker.name,
        title=banker.title,
        region=banker.region,
        email=banker.email,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    smb_id = body.smb_id
    message = body.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history = await get_history(smb_id, limit=10)

    result = await run_agent(
        smb_id=smb_id,
        phone="app",
        message=message,
        history=history,
    )

    reply = result.get("reply", "Sorry, something went wrong. Please try again.")
    intent = result.get("intent", "")
    escalated = result.get("escalated", False)
    tool_result = result.get("tool_result", {})
    escalation_result = result.get("escalation_result", {})

    CHAT_MESSAGES.labels(intent=intent or "unknown").inc()
    if escalated:
        ESCALATIONS.inc()

    # For auto-escalations, merge the escalation result into tool_result for stream
    esc_source = tool_result if tool_result.get("ticket_number") else escalation_result

    await save_message(smb_id, "user", message)
    await save_message(smb_id, "assistant", reply)

    # Extract ticket + RM info from whichever source has it
    ticket_number = esc_source.get("ticket_number")
    rm_data = esc_source.get("assigned_rm")
    assigned_rm = None
    if rm_data and isinstance(rm_data, dict):
        assigned_rm = RMContactOut(
            name=rm_data.get("name", ""),
            title=rm_data.get("title", ""),
            email=rm_data.get("email", ""),
        )

    # Publish to RM stream (fire-and-forget — don't block the response)
    try:
        smb_name = tool_result.get("smb_name") or await _resolve_smb_name(smb_id)

        highlight = await generate_rm_highlight(
            smb_name=smb_name,
            intent=intent,
            message=message,
            tool_result=tool_result,
            escalated=escalated,
        )

        urgency = "high" if escalated else (
            "medium" if intent in ("credit_prequal_request", "cash_flow_query") else "low"
        )
        requested_amount = tool_result.get("requested_amount")

        event = chat_highlight_event(
            smb_id=smb_id,
            smb_name=smb_name,
            intent=intent,
            highlight=highlight,
            escalated=escalated,
            urgency=urgency,
            requested_amount=requested_amount,
            ticket_number=ticket_number,
            rm_name=assigned_rm.name if assigned_rm else None,
        )
        await publish_event(event)
    except Exception as e:
        logger.warning("Failed to publish stream event: %s", e)

    return ChatResponse(
        reply=reply,
        intent=intent,
        escalated=escalated,
        ticket_number=ticket_number,
        assigned_rm=assigned_rm,
    )


async def _resolve_smb_name(smb_id: str) -> str:
    """Quick lookup of SMB name for stream events."""
    try:
        async with async_session() as session:
            result = await session.execute(
                select(SMB.name).where(SMB.id == uuid.UUID(smb_id))
            )
            return result.scalar_one_or_none() or smb_id
    except Exception:
        return smb_id


@router.get("/chat/{smb_id}/history", response_model=list[HistoryMessage])
async def chat_history(smb_id: str, limit: int = 50):
    messages = await get_history(smb_id, limit=limit)
    return [HistoryMessage(role=m["role"], content=m["content"]) for m in messages]
