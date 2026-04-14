from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/brilliantbanker.db"

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


# --- RM Contact ---


class RMContact(BaseModel):
    name: str
    title: str
    email: str
    region: str


# --- Escalation ---


class EscalationResult(BaseModel):
    lead_id: str
    ticket_number: str
    smb_id: str
    reason: str
    urgency: str
    status: str = "pending"
    assigned_rm: RMContact | None = None


# --- Banker API ---


class LeadOut(BaseModel):
    id: UUID
    ticket_number: str = ""
    smb_id: UUID
    smb_name: str | None = None
    business_type: str | None = None
    status: str
    requested_amount: int | None
    credit_score: float | None
    urgency_score: float
    reason: str | None = None
    created_at: datetime | None = None
    assigned_rm_name: str | None = None


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


# --- Banker ---


class BankerOut(BaseModel):
    banker_id: str
    name: str
    title: str
    region: str
    email: str


class BankerLoginRequest(BaseModel):
    banker_id: str


class PortfolioSMB(BaseModel):
    id: UUID
    name: str
    business_type: str
    annual_revenue: int
    avg_monthly_revenue: int
    cash_stability: float
    payment_history: float
    phone: str


class PortfolioOut(BaseModel):
    smbs: list[PortfolioSMB]


class TransactionOut(BaseModel):
    id: UUID
    description: str
    amount: int
    category: str
    txn_date: datetime


class SMBLeadOut(BaseModel):
    id: UUID
    ticket_number: str = ""
    status: str
    requested_amount: int | None
    credit_score: float | None
    urgency_score: float
    reason: str | None = None
    created_at: datetime | None = None
    notification_text: str | None = None
    assigned_rm: RMContact | None = None


class BankerNoteOut(BaseModel):
    id: UUID
    note: str
    banker_name: str
    created_at: datetime


class BankerNoteRequest(BaseModel):
    note: str
