from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import UserFeedback, get_session as db_session_dep

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


class FeedbackSubmitBody(BaseModel):
    role: Literal["smb", "banker"]
    screen_path: str = Field(max_length=500)
    respondent_name: str = Field(max_length=500)
    comment: str = Field(min_length=1, max_length=5000)
    rating: int | None = Field(default=None, ge=1, le=5)


@router.post("/submit")
async def submit_feedback(
    body: FeedbackSubmitBody,
    session: AsyncSession = Depends(db_session_dep),
):
    row = UserFeedback(
        role=body.role,
        screen_path=body.screen_path,
        respondent_name=body.respondent_name,
        rating=body.rating,
        comment=body.comment.strip(),
    )
    session.add(row)
    await session.commit()
    return {"ok": True, "message": "Thank you for your feedback"}
