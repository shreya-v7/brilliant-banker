from __future__ import annotations

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agent.graph import run_agent
from backend.db.mongo_client import get_history, save_message
from backend.db.postgres import SMB, get_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    smb_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    intent: str
    escalated: bool


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

    await save_message(smb_id, "user", message)
    await save_message(smb_id, "assistant", reply)

    return ChatResponse(reply=reply, intent=intent, escalated=escalated)


@router.get("/chat/{smb_id}/history", response_model=list[HistoryMessage])
async def chat_history(smb_id: str, limit: int = 50):
    messages = await get_history(smb_id, limit=limit)
    return [HistoryMessage(role=m["role"], content=m["content"]) for m in messages]
