from __future__ import annotations

import io
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.db.database import SurveyAnswer, SurveyResponse, get_session as db_session_dep

router = APIRouter(prefix="/api/survey", tags=["survey"])

ADMIN_PASSWORD = "brilliantbanker2026"


class SurveyAnswerIn(BaseModel):
    question_id: str
    question_text: str
    answer_type: str
    answer: str | int | float
    task_completed: bool = False


class SurveySubmitBody(BaseModel):
    role: Literal["smb", "banker"]
    respondent_name: str
    respondent_business: str | None = None
    respondent_email: str | None = None
    tasks_completed: int = 0
    total_tasks: int = 0
    responses: list[SurveyAnswerIn]
    overall_nps: int | None = Field(default=None, ge=0, le=10)
    overall_comment: str | None = None


@router.post("/submit")
async def submit_survey(
    body: SurveySubmitBody,
    session: AsyncSession = Depends(db_session_dep),
):
    survey = SurveyResponse(
        participant_role=body.role,
        respondent_name=body.respondent_name.strip(),
        respondent_business=(body.respondent_business or "").strip() or None,
        respondent_email=(body.respondent_email or "").strip() or None,
        tasks_completed=body.tasks_completed,
        total_tasks=body.total_tasks,
        overall_nps=body.overall_nps,
        overall_comment=(body.overall_comment or "").strip() or None,
    )
    session.add(survey)
    await session.flush()

    for r in body.responses:
        ans = str(r.answer) if r.answer is not None else ""
        row = SurveyAnswer(
            survey_id=survey.id,
            question_id=r.question_id,
            question_text=r.question_text,
            answer_type=r.answer_type,
            answer=ans,
            task_completed=bool(r.task_completed),
        )
        session.add(row)

    await session.commit()
    return {
        "id": survey.id,
        "status": "saved",
        "message": "Thank you for your feedback",
    }


def _nps_bucket(v: int) -> str:
    if v <= 6:
        return "detractor"
    if v <= 8:
        return "passive"
    return "promoter"


@router.get("/results")
async def survey_results(
    password: str = Query(""),
    session: AsyncSession = Depends(db_session_dep),
):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")

    q = await session.execute(
        select(SurveyResponse)
        .options(selectinload(SurveyResponse.answers))
        .order_by(SurveyResponse.created_at.asc())
    )
    rows = q.scalars().all()

    if not rows:
        return {
            "total_responses": 0,
            "smb_count": 0,
            "banker_count": 0,
            "avg_nps": None,
            "avg_nps_smb": None,
            "avg_nps_banker": None,
            "per_question": [],
            "recent_comments": [],
            "raw_surveys": [],
            "date_range": {"min": None, "max": None},
        }

    smb_count = sum(1 for s in rows if s.participant_role == "smb")
    banker_count = sum(1 for s in rows if s.participant_role == "banker")

    smb_nps = [s.overall_nps for s in rows if s.participant_role == "smb" and s.overall_nps is not None]
    banker_nps = [s.overall_nps for s in rows if s.participant_role == "banker" and s.overall_nps is not None]
    avg_nps_smb = sum(smb_nps) / len(smb_nps) if smb_nps else None
    avg_nps_banker = sum(banker_nps) / len(banker_nps) if banker_nps else None

    dates = [s.created_at for s in rows if s.created_at]
    date_range = {
        "min": min(dates).isoformat() if dates else None,
        "max": max(dates).isoformat() if dates else None,
    }

    by_q: dict[str, dict[str, Any]] = {}

    def ensure_q(qid: str, qtext: str, atype: str) -> dict[str, Any]:
        if qid not in by_q:
            by_q[qid] = {
                "question_id": qid,
                "question_text": qtext,
                "answer_type": atype,
                "avg_rating": None,
                "distribution": {},
                "choices": {},
                "free_texts": [],
                "task_completion_rate": None,
                "nps_distribution": {"detractor": 0, "passive": 0, "promoter": 0},
                "nps_avg": None,
            }
        return by_q[qid]

    for s in rows:
        for a in s.answers:
            bucket = ensure_q(a.question_id, a.question_text, a.answer_type)
            at = a.answer_type

            if at in ("rating", "task_rating"):
                try:
                    v = int(float(a.answer))
                    key = str(v)
                    bucket["distribution"][key] = bucket["distribution"].get(key, 0) + 1
                except (ValueError, TypeError):
                    pass

            elif at == "multiple_choice":
                c = a.answer.strip()
                bucket["choices"][c] = bucket["choices"].get(c, 0) + 1

            elif at == "free_text":
                if a.answer.strip():
                    bucket["free_texts"].append(a.answer.strip())

            elif at == "nps":
                try:
                    v = int(float(a.answer))
                    bucket["nps_distribution"][_nps_bucket(v)] += 1
                except (ValueError, TypeError):
                    pass

    for qid, b in by_q.items():
        at = b["answer_type"]
        if at in ("rating", "task_rating"):
            dist = b["distribution"]
            nums = []
            for k, cnt in dist.items():
                try:
                    ki = int(k)
                    nums.extend([ki] * cnt)
                except ValueError:
                    pass
            if nums:
                b["avg_rating"] = round(sum(nums) / len(nums), 2)
        if at == "task_rating":
            tc = sum(1 for s in rows for x in s.answers if x.question_id == qid and x.task_completed)
            tot = sum(1 for s in rows for x in s.answers if x.question_id == qid)
            if tot:
                b["task_completion_rate"] = round(tc / tot, 4)

        if at == "nps":
            scores = []
            for s in rows:
                for x in s.answers:
                    if x.question_id == qid and x.answer_type == "nps":
                        try:
                            scores.append(int(float(x.answer)))
                        except (ValueError, TypeError):
                            pass
            if scores:
                b["nps_avg"] = round(sum(scores) / len(scores), 2)

    per_question = list(by_q.values())

    recent_comments = []
    for s in reversed(rows[-20:]):
        if s.overall_comment:
            recent_comments.append(
                {
                    "name": s.respondent_name,
                    "role": s.participant_role,
                    "comment": s.overall_comment,
                    "date": s.created_at.isoformat() if s.created_at else "",
                }
            )

    raw_surveys = []
    for s in rows:
        raw_surveys.append(
            {
                "id": s.id,
                "role": s.participant_role,
                "respondent_name": s.respondent_name,
                "respondent_business": s.respondent_business,
                "respondent_email": s.respondent_email,
                "tasks_completed": s.tasks_completed,
                "total_tasks": s.total_tasks,
                "overall_nps": s.overall_nps,
                "overall_comment": s.overall_comment,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "responses": [
                    {
                        "question_id": a.question_id,
                        "question_text": a.question_text,
                        "answer_type": a.answer_type,
                        "answer": a.answer,
                        "task_completed": a.task_completed,
                    }
                    for a in s.answers
                ],
            }
        )

    all_nps = [s.overall_nps for s in rows if s.overall_nps is not None]
    avg_nps_val = sum(all_nps) / len(all_nps) if all_nps else None

    task_rates = []
    for s in rows:
        if s.total_tasks and s.total_tasks > 0:
            task_rates.append(s.tasks_completed / s.total_tasks)

    rating_avgs = []
    for pq in per_question:
        if pq["answer_type"] in ("rating", "task_rating") and pq.get("avg_rating") is not None:
            rating_avgs.append(pq["avg_rating"])

    return {
        "total_responses": len(rows),
        "smb_count": smb_count,
        "banker_count": banker_count,
        "avg_nps": round(avg_nps_val, 2) if avg_nps_val is not None else None,
        "avg_nps_smb": round(avg_nps_smb, 2) if avg_nps_smb is not None else None,
        "avg_nps_banker": round(avg_nps_banker, 2) if avg_nps_banker is not None else None,
        "avg_task_completion_rate": round(sum(task_rates) / len(task_rates), 4) if task_rates else None,
        "avg_feature_rating": round(sum(rating_avgs) / len(rating_avgs), 2) if rating_avgs else None,
        "per_question": per_question,
        "recent_comments": recent_comments[:20],
        "raw_surveys": raw_surveys,
        "date_range": date_range,
    }


@router.get("/export")
async def survey_export(
    password: str = Query(""),
    session: AsyncSession = Depends(db_session_dep),
):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")

    q = await session.execute(
        select(SurveyResponse).options(selectinload(SurveyResponse.answers)).order_by(SurveyResponse.created_at.asc())
    )
    rows = q.scalars().all()

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "survey_id",
            "created_at",
            "role",
            "respondent_name",
            "respondent_business",
            "respondent_email",
            "tasks_completed",
            "total_tasks",
            "overall_nps",
            "overall_comment",
            "question_id",
            "question_text",
            "answer_type",
            "answer",
            "task_completed",
        ]
    )
    for s in rows:
        if not s.answers:
            w.writerow(
                [
                    s.id,
                    s.created_at.isoformat() if s.created_at else "",
                    s.participant_role,
                    s.respondent_name,
                    s.respondent_business or "",
                    s.respondent_email or "",
                    s.tasks_completed,
                    s.total_tasks,
                    s.overall_nps if s.overall_nps is not None else "",
                    s.overall_comment or "",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]
            )
        else:
            for a in s.answers:
                w.writerow(
                    [
                        s.id,
                        s.created_at.isoformat() if s.created_at else "",
                        s.participant_role,
                        s.respondent_name,
                        s.respondent_business or "",
                        s.respondent_email or "",
                        s.tasks_completed,
                        s.total_tasks,
                        s.overall_nps if s.overall_nps is not None else "",
                        s.overall_comment or "",
                        a.question_id,
                        a.question_text,
                        a.answer_type,
                        a.answer,
                        int(a.task_completed),
                    ]
                )

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="survey_export.csv"'},
    )
