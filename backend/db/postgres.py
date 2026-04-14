from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

import ssl as _ssl

from backend.models.schemas import Settings

settings = Settings()

_connect_args: dict = {}
if settings.is_remote_db:
    _ctx = _ssl.create_default_context()
    _ctx.check_hostname = False
    _ctx.verify_mode = _ssl.CERT_NONE
    _connect_args["ssl"] = _ctx

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=5,
    connect_args=_connect_args,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class SMB(Base):
    __tablename__ = "smbs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    smb_id = Column(UUID(as_uuid=True), ForeignKey("smbs.id"), nullable=False)
    assigned_banker_id = Column(UUID(as_uuid=True), ForeignKey("bankers.id"), nullable=True)
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    action = Column(String(20), nullable=False)
    amount = Column(Integer, nullable=True)
    banker_note = Column(Text, nullable=True)
    banker_id = Column(String(100), nullable=True)
    sms_sent = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    lead = relationship("Lead", back_populates="events", lazy="selectin")


class Banker(Base):
    __tablename__ = "bankers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    title = Column(String(200), nullable=False)
    region = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    notes = relationship("BankerNote", back_populates="banker", lazy="selectin")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    smb_id = Column(UUID(as_uuid=True), ForeignKey("smbs.id"), nullable=False)
    description = Column(String(300), nullable=False)
    amount = Column(Integer, nullable=False)   # positive = credit, negative = debit
    category = Column(String(100), nullable=False, default="other")
    txn_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    smb = relationship("SMB", back_populates="transactions", lazy="selectin")


class BankerNote(Base):
    __tablename__ = "banker_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    smb_id = Column(UUID(as_uuid=True), ForeignKey("smbs.id"), nullable=False)
    banker_id = Column(UUID(as_uuid=True), ForeignKey("bankers.id"), nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    smb = relationship("SMB", back_populates="banker_notes", lazy="selectin")
    banker = relationship("Banker", back_populates="notes", lazy="selectin")


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
