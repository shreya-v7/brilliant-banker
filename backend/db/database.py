from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from backend.models.schemas import Settings

settings = Settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={},
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class SMB(Base):
    __tablename__ = "smbs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    business_type = Column(String(100), nullable=False)
    annual_revenue = Column(Integer, nullable=False)
    avg_monthly_revenue = Column(Integer, nullable=False)
    cash_stability = Column(Float, nullable=False)
    payment_history = Column(Float, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    leads = relationship("Lead", back_populates="smb", lazy="selectin")
    transactions = relationship("Transaction", back_populates="smb", lazy="selectin")
    banker_notes = relationship("BankerNote", back_populates="smb", lazy="selectin")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    smb_id = Column(String(36), ForeignKey("smbs.id"), nullable=False)
    assigned_banker_id = Column(String(36), ForeignKey("bankers.id"), nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    requested_amount = Column(Integer, nullable=True)
    credit_score = Column(Float, nullable=True)
    urgency_score = Column(Float, nullable=False, default=0.5)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    smb = relationship("SMB", back_populates="leads", lazy="selectin")
    assigned_banker = relationship("Banker", foreign_keys=[assigned_banker_id], lazy="selectin")
    events = relationship("LeadEvent", back_populates="lead", lazy="selectin")


class LeadEvent(Base):
    __tablename__ = "lead_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id"), nullable=False)
    action = Column(String(20), nullable=False)
    amount = Column(Integer, nullable=True)
    banker_note = Column(Text, nullable=True)
    banker_id = Column(String(100), nullable=True)
    sms_sent = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    lead = relationship("Lead", back_populates="events", lazy="selectin")


class Banker(Base):
    __tablename__ = "bankers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    title = Column(String(200), nullable=False)
    region = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    notes = relationship("BankerNote", back_populates="banker", lazy="selectin")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    smb_id = Column(String(36), ForeignKey("smbs.id"), nullable=False)
    description = Column(String(300), nullable=False)
    amount = Column(Integer, nullable=False)
    category = Column(String(100), nullable=False, default="other")
    txn_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    smb = relationship("SMB", back_populates="transactions", lazy="selectin")


class BankerNote(Base):
    __tablename__ = "banker_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    smb_id = Column(String(36), ForeignKey("smbs.id"), nullable=False)
    banker_id = Column(String(36), ForeignKey("bankers.id"), nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    smb = relationship("SMB", back_populates="banker_notes", lazy="selectin")
    banker = relationship("Banker", back_populates="notes", lazy="selectin")


class Conversation(Base):
    """Chat history  - replaces MongoDB conversations collection."""
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    smb_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    participant_role = Column("role", String(10), nullable=False)
    respondent_name = Column(String(500), nullable=False)
    respondent_business = Column(Text, nullable=True)
    respondent_email = Column(Text, nullable=True)
    tasks_completed = Column(Integer, nullable=False, default=0)
    total_tasks = Column(Integer, nullable=False, default=0)
    overall_nps = Column(Integer, nullable=True)
    overall_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    answers = relationship("SurveyAnswer", back_populates="survey", lazy="selectin")


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    id = Column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    survey_id = Column(String(32), ForeignKey("survey_responses.id"), nullable=False)
    question_id = Column(String(100), nullable=False)
    question_text = Column(Text, nullable=False)
    answer_type = Column(String(40), nullable=False)
    answer = Column(Text, nullable=False)
    task_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())

    survey = relationship("SurveyResponse", back_populates="answers")


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
