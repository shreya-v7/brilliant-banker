from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.postgres import SMB, get_session
from backend.models.schemas import SMBProfile
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
        select(SMB).where(SMB.id == uuid.UUID(smb_id))
    )
    smb = result.scalar_one_or_none()
    if not smb:
        raise HTTPException(status_code=404, detail="SMB not found")

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
