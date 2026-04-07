from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@postgres:5432/brilliantbanker"
    REDIS_URL: str = "redis://redis:6379"
    MONGODB_URL: str = "mongodb://mongo:27017"
    MONGODB_DB: str = "brilliantbanker"

    model_config = {"env_file": ".env", "extra": "ignore"}


# --- Agent state ---


class AgentState(BaseModel):
    smb_id: str
    phone: str
    message: str
    history: list[dict] = Field(default_factory=list)
    intent: str = ""
    tool_result: dict = Field(default_factory=dict)
    reply: str = ""
    escalated: bool = False


# --- Cash flow ---


class CashFlowForecast(BaseModel):
    smb_id: str
    smb_name: str
    business_type: str
    avg_monthly_revenue: int
    cash_stability: float
    projected_30_day_revenue: int
    projected_30_day_expenses: int
    projected_net: int
    risk_flag: str


# --- Credit pre-qualification ---


class CreditPrequalResult(BaseModel):
    eligible: bool
    probability: float
    max_amount: int
    reason: str
    requested_amount: int


# --- FAQ ---


class FAQResult(BaseModel):
    question: str
    answer: str
    confidence: float


# --- Escalation ---


class EscalationResult(BaseModel):
    lead_id: str
    smb_id: str
    reason: str
    urgency: str
    status: str = "pending"


# --- Banker API ---


class LeadOut(BaseModel):
    id: UUID
    smb_id: UUID
    smb_name: str | None = None
    business_type: str | None = None
    status: str
    requested_amount: int | None
    credit_score: float | None
    urgency_score: float
    reason: str | None = None
    created_at: datetime | None = None


class DecisionRequest(BaseModel):
    action: Literal["approved", "declined", "referred"]
    amount: int | None = None
    banker_note: str = ""


class DecisionResponse(BaseModel):
    lead_id: str
    action: str
    notification_text: str


class SMBProfile(BaseModel):
    id: UUID
    name: str
    business_type: str
    annual_revenue: int
    avg_monthly_revenue: int
    cash_stability: float
    payment_history: float
    phone: str
    ai_brief: str | None = None
