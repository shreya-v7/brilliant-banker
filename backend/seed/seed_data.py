"""
Seed mock data into Postgres and Redis.

Run from project root:
    python -m backend.seed.seed_data
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select

from backend.db.postgres import (
    Base, SMB, Banker, Lead, LeadEvent, Transaction, BankerNote,
    engine, async_session, init_db,
)
from backend.db.redis_client import set_phone_mapping

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ── Demo bankers ──────────────────────────────────────────────────────────────

MOCK_BANKERS = [
    {
        "id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "name": "Sarah Chen",
        "title": "Senior Business Banking Advisor",
        "region": "Northeast",
        "email": "sarah.chen@pnc.com",
    },
    {
        "id": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        "name": "Marcus Williams",
        "title": "SMB Relationship Manager",
        "region": "Southeast",
        "email": "marcus.williams@pnc.com",
    },
    {
        "id": uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        "name": "Jordan Patel",
        "title": "Business Credit Specialist",
        "region": "Midwest",
        "email": "jordan.patel@pnc.com",
    },
]

# ── SMB owners ────────────────────────────────────────────────────────────────

MOCK_SMBS = [
    {
        "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
        "name": "Anne Fox",
        "business_type": "Floral design",
        "annual_revenue": 1_200_000,
        "avg_monthly_revenue": 98_000,
        "cash_stability": 0.72,
        "payment_history": 0.88,
        "phone": "+14151110001",
    },
    {
        "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
        "name": "Justin Strong",
        "business_type": "Dry cleaning",
        "annual_revenue": 532_000,
        "avg_monthly_revenue": 44_000,
        "cash_stability": 0.61,
        "payment_history": 0.79,
        "phone": "+14151110002",
    },
    {
        "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
        "name": "Melissa Murphy",
        "business_type": "Restaurant",
        "annual_revenue": 680_000,
        "avg_monthly_revenue": 56_000,
        "cash_stability": 0.45,
        "payment_history": 0.82,
        "phone": "+14151110003",
    },
    {
        "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
        "name": "Valentina Cruz",
        "business_type": "Bike tourism",
        "annual_revenue": 490_000,
        "avg_monthly_revenue": 41_000,
        "cash_stability": 0.38,
        "payment_history": 0.75,
        "phone": "+14151110004",
    },
    {
        "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
        "name": "Richard Watterson",
        "business_type": "Bookkeeping",
        "annual_revenue": 85_000,
        "avg_monthly_revenue": 7_000,
        "cash_stability": 0.91,
        "payment_history": 0.95,
        "phone": "+14151110005",
    },
]

# ── Transactions per SMB (last 30 days) ───────────────────────────────────────

def days_ago(n): return datetime.now() - timedelta(days=n)

MOCK_TRANSACTIONS = {
    "11111111-1111-1111-1111-111111111111": [  # Anne Fox - Floral
        {"description": "Wholesale Flowers - BloomNet", "amount": -8_400, "category": "supplies", "txn_date": days_ago(1)},
        {"description": "Wedding Event - Johnson Wedding", "amount": 12_500, "category": "revenue", "txn_date": days_ago(2)},
        {"description": "Payroll - ADP", "amount": -14_200, "category": "payroll", "txn_date": days_ago(3)},
        {"description": "Corporate Account - TechCorp", "amount": 6_800, "category": "revenue", "txn_date": days_ago(5)},
        {"description": "Shopify Monthly", "amount": -79, "category": "software", "txn_date": days_ago(6)},
        {"description": "Delivery - FedEx", "amount": -340, "category": "supplies", "txn_date": days_ago(7)},
        {"description": "Event - Gala Centerpieces", "amount": 9_200, "category": "revenue", "txn_date": days_ago(9)},
        {"description": "Refrigeration Repair", "amount": -2_100, "category": "maintenance", "txn_date": days_ago(11)},
        {"description": "Retail Walk-in Sales", "amount": 3_450, "category": "revenue", "txn_date": days_ago(12)},
        {"description": "QuickBooks Online", "amount": -85, "category": "software", "txn_date": days_ago(14)},
        {"description": "Funeral Home - Eastside", "amount": 4_100, "category": "revenue", "txn_date": days_ago(16)},
        {"description": "Payroll - ADP", "amount": -14_200, "category": "payroll", "txn_date": days_ago(17)},
        {"description": "Wholesale Flowers - BloomNet", "amount": -7_800, "category": "supplies", "txn_date": days_ago(19)},
        {"description": "Hotel Contract - Marriott", "amount": 8_900, "category": "revenue", "txn_date": days_ago(21)},
        {"description": "Utility - PG&E", "amount": -620, "category": "utilities", "txn_date": days_ago(23)},
        {"description": "Retail Walk-in Sales", "amount": 2_870, "category": "revenue", "txn_date": days_ago(25)},
        {"description": "Insurance - Hiscox", "amount": -540, "category": "insurance", "txn_date": days_ago(28)},
        {"description": "Payroll - ADP", "amount": -14_200, "category": "payroll", "txn_date": days_ago(31)},
    ],
    "22222222-2222-2222-2222-222222222222": [  # Justin Strong - Dry Cleaning
        {"description": "Commercial Lease - Main St", "amount": -3_800, "category": "rent", "txn_date": days_ago(1)},
        {"description": "Daily Drop-off Revenue", "amount": 2_100, "category": "revenue", "txn_date": days_ago(1)},
        {"description": "Cleaning Chemicals - SupplyCo", "amount": -1_240, "category": "supplies", "txn_date": days_ago(3)},
        {"description": "Corporate Accounts - WeWork", "amount": 4_500, "category": "revenue", "txn_date": days_ago(4)},
        {"description": "Payroll - Paychex", "amount": -8_600, "category": "payroll", "txn_date": days_ago(5)},
        {"description": "Daily Drop-off Revenue", "amount": 1_950, "category": "revenue", "txn_date": days_ago(6)},
        {"description": "Equipment Maintenance", "amount": -890, "category": "maintenance", "txn_date": days_ago(8)},
        {"description": "Daily Drop-off Revenue", "amount": 2_340, "category": "revenue", "txn_date": days_ago(9)},
        {"description": "Utility - ConEd Electric", "amount": -1_100, "category": "utilities", "txn_date": days_ago(10)},
        {"description": "Hotel Contract - Hilton", "amount": 3_200, "category": "revenue", "txn_date": days_ago(12)},
        {"description": "Payroll - Paychex", "amount": -8_600, "category": "payroll", "txn_date": days_ago(19)},
        {"description": "Insurance Renewal", "amount": -1_800, "category": "insurance", "txn_date": days_ago(22)},
        {"description": "Daily Drop-off Revenue", "amount": 2_050, "category": "revenue", "txn_date": days_ago(24)},
        {"description": "New Press Machine - Hoffman", "amount": -12_000, "category": "equipment", "txn_date": days_ago(26)},
        {"description": "Daily Drop-off Revenue", "amount": 1_780, "category": "revenue", "txn_date": days_ago(28)},
    ],
    "33333333-3333-3333-3333-333333333333": [  # Melissa Murphy - Restaurant
        {"description": "Food Delivery - Sysco", "amount": -6_800, "category": "supplies", "txn_date": days_ago(1)},
        {"description": "Dinner Service Revenue", "amount": 4_200, "category": "revenue", "txn_date": days_ago(1)},
        {"description": "Payroll - ADP", "amount": -18_400, "category": "payroll", "txn_date": days_ago(3)},
        {"description": "Lunch Revenue", "amount": 1_950, "category": "revenue", "txn_date": days_ago(3)},
        {"description": "Grubhub Settlement", "amount": 3_100, "category": "revenue", "txn_date": days_ago(5)},
        {"description": "Lease - Restaurant Space", "amount": -7_200, "category": "rent", "txn_date": days_ago(6)},
        {"description": "Food Delivery - Sysco", "amount": -5_900, "category": "supplies", "txn_date": days_ago(8)},
        {"description": "Dinner Service Revenue", "amount": 5_800, "category": "revenue", "txn_date": days_ago(8)},
        {"description": "NSF Fee - Overdraft", "amount": -35, "category": "fees", "txn_date": days_ago(9)},
        {"description": "Catering - Corporate Event", "amount": 3_400, "category": "revenue", "txn_date": days_ago(11)},
        {"description": "HVAC Emergency Repair", "amount": -3_200, "category": "maintenance", "txn_date": days_ago(13)},
        {"description": "Payroll - ADP", "amount": -18_400, "category": "payroll", "txn_date": days_ago(17)},
        {"description": "Dinner Service Revenue", "amount": 4_600, "category": "revenue", "txn_date": days_ago(17)},
        {"description": "POS System - Square", "amount": -89, "category": "software", "txn_date": days_ago(20)},
        {"description": "Utility - Gas & Electric", "amount": -2_100, "category": "utilities", "txn_date": days_ago(22)},
        {"description": "Missed Payment - NSF", "amount": -35, "category": "fees", "txn_date": days_ago(24)},
        {"description": "Weekend Brunch Revenue", "amount": 3_900, "category": "revenue", "txn_date": days_ago(25)},
        {"description": "Food Delivery - Sysco", "amount": -6_200, "category": "supplies", "txn_date": days_ago(27)},
    ],
    "44444444-4444-4444-4444-444444444444": [  # Valentina Cruz - Bike Tourism
        {"description": "Tour Bookings - April", "amount": 5_200, "category": "revenue", "txn_date": days_ago(2)},
        {"description": "Bike Fleet Maintenance", "amount": -2_800, "category": "maintenance", "txn_date": days_ago(4)},
        {"description": "Payroll - Seasonal Staff", "amount": -9_100, "category": "payroll", "txn_date": days_ago(5)},
        {"description": "Tour Bookings - Online", "amount": 3_800, "category": "revenue", "txn_date": days_ago(6)},
        {"description": "Storage Unit Rental", "amount": -450, "category": "rent", "txn_date": days_ago(7)},
        {"description": "Bike Parts - Amazon", "amount": -1_200, "category": "supplies", "txn_date": days_ago(9)},
        {"description": "Hotel Partnership Commission", "amount": 1_900, "category": "revenue", "txn_date": days_ago(11)},
        {"description": "Offline - No Revenue", "amount": 0, "category": "note", "txn_date": days_ago(12)},
        {"description": "Insurance - Fleet", "amount": -2_400, "category": "insurance", "txn_date": days_ago(14)},
        {"description": "Tour Bookings - Weekend", "amount": 4_100, "category": "revenue", "txn_date": days_ago(15)},
        {"description": "Payroll - Seasonal Staff", "amount": -9_100, "category": "payroll", "txn_date": days_ago(19)},
        {"description": "Website - Squarespace", "amount": -23, "category": "software", "txn_date": days_ago(20)},
        {"description": "Tour Cancellations Refund", "amount": -1_800, "category": "refund", "txn_date": days_ago(22)},
        {"description": "Corporate Team Building", "amount": 6_400, "category": "revenue", "txn_date": days_ago(24)},
        {"description": "NSF - Payment Bounced", "amount": -35, "category": "fees", "txn_date": days_ago(26)},
    ],
    "55555555-5555-5555-5555-555555555555": [  # Richard Watterson - Bookkeeping
        {"description": "Client Retainer - March", "amount": 2_800, "category": "revenue", "txn_date": days_ago(1)},
        {"description": "Software - QuickBooks Pro", "amount": -180, "category": "software", "txn_date": days_ago(3)},
        {"description": "Client Retainer - Smith LLC", "amount": 1_400, "category": "revenue", "txn_date": days_ago(4)},
        {"description": "Home Office Expenses", "amount": -320, "category": "overhead", "txn_date": days_ago(6)},
        {"description": "Client Retainer - Garcia Co", "amount": 950, "category": "revenue", "txn_date": days_ago(8)},
        {"description": "Professional Development", "amount": -450, "category": "education", "txn_date": days_ago(10)},
        {"description": "Client Retainer - April", "amount": 2_800, "category": "revenue", "txn_date": days_ago(15)},
        {"description": "Software - Xero", "amount": -72, "category": "software", "txn_date": days_ago(16)},
        {"description": "Tax Filing Client - 1099s", "amount": 600, "category": "revenue", "txn_date": days_ago(18)},
        {"description": "Client Retainer - New Account", "amount": 1_200, "category": "revenue", "txn_date": days_ago(22)},
        {"description": "CPA License Renewal", "amount": -290, "category": "overhead", "txn_date": days_ago(25)},
        {"description": "Client Retainer - Jones Ltd", "amount": 1_100, "category": "revenue", "txn_date": days_ago(28)},
    ],
}

# ── Demo leads (some pending for the demo) ────────────────────────────────────

MOCK_LEADS = [
    # Melissa - restaurant struggling, high urgency credit request
    {
        "id": uuid.UUID("1ead1111-1111-1111-1111-111111111111"),
        "smb_id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
        "status": "pending",
        "requested_amount": 35_000,
        "credit_score": 0.64,
        "urgency_score": 0.85,
        "reason": "Requesting $35K line of credit to cover payroll gap and emergency HVAC repair. Cash flow has been strained by lower-than-expected foot traffic this quarter.",
    },
    # Valentina - bike tour, seasonal cash crunch
    {
        "id": uuid.UUID("2ead2222-2222-2222-2222-222222222222"),
        "smb_id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
        "status": "pending",
        "requested_amount": 20_000,
        "credit_score": 0.57,
        "urgency_score": 0.72,
        "reason": "Seasonal business needs bridge financing to purchase 15 new e-bikes before peak summer season. Tour bookings are up 40% YoY but cash reserves are low.",
    },
    # Justin - already approved (shows workflow completion)
    {
        "id": uuid.UUID("3ead3333-3333-3333-3333-333333333333"),
        "smb_id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
        "status": "approved",
        "requested_amount": 15_000,
        "credit_score": 0.71,
        "urgency_score": 0.55,
        "reason": "Equipment upgrade - new commercial press machine to expand capacity.",
    },
    # Anne - referred for large amount
    {
        "id": uuid.UUID("4ead4444-4444-4444-4444-444444444444"),
        "smb_id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
        "status": "referred",
        "requested_amount": 120_000,
        "credit_score": 0.82,
        "urgency_score": 0.4,
        "reason": "Expansion financing to open second location in downtown area. Reviewing SBA loan options.",
    },
]

# Events for the closed leads
MOCK_LEAD_EVENTS = [
    {
        "lead_id": uuid.UUID("3ead3333-3333-3333-3333-333333333333"),
        "action": "approved",
        "amount": 15_000,
        "banker_note": "Strong payment history and stable cash flow. Approved standard LOC.",
        "banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "sms_sent": "Great news, Justin! Your $15,000 line of credit has been approved. You can access funds through your PNC account within 24 hours.",
    },
    {
        "lead_id": uuid.UUID("4ead4444-4444-4444-4444-444444444444"),
        "action": "referred",
        "amount": 120_000,
        "banker_note": "Great profile but amount requires SBA review. Referring to specialist team.",
        "banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "sms_sent": "Hi Anne, your expansion financing request is being reviewed by our SBA specialist team. A banker will call within 24 hours to walk you through your options.",
    },
]

# Demo banker notes
MOCK_NOTES = [
    {
        "smb_id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
        "banker_id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "note": "Called Melissa 4/2. HVAC repair hurt March numbers badly. Strong customer retention, just needs bridge financing. Follow up on LOC application status.",
    },
    {
        "smb_id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
        "banker_id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "note": "Valentina has excellent tour reviews online. Seasonal pattern is normal for bike tourism. E-bike purchase is strategic — consider approving with seasonal repayment schedule.",
    },
    {
        "smb_id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
        "banker_id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "note": "Anne's second location plan is solid. She's been a PNC client for 8 years with zero missed payments. Fast-track SBA 7(a) review.",
    },
]


async def seed():
    logger.info("Initializing database tables...")
    await init_db()

    async with async_session() as session:

        # ── SMBs ──
        existing_smbs = {r[0] for r in (await session.execute(select(SMB.id))).all()}
        smb_added = 0
        for data in MOCK_SMBS:
            if data["id"] not in existing_smbs:
                session.add(SMB(**data))
                smb_added += 1
                logger.info("  Added SMB: %s", data["name"])
        await session.commit()
        logger.info("SMBs: %d added", smb_added)

        # ── Bankers ──
        existing_bankers = {r[0] for r in (await session.execute(select(Banker.id))).all()}
        banker_added = 0
        for data in MOCK_BANKERS:
            if data["id"] not in existing_bankers:
                session.add(Banker(**data))
                banker_added += 1
                logger.info("  Added Banker: %s", data["name"])
        await session.commit()
        logger.info("Bankers: %d added", banker_added)

        # ── Transactions ──
        existing_txns = {r[0] for r in (await session.execute(select(Transaction.smb_id))).all()}
        txn_added = 0
        for smb_id_str, txns in MOCK_TRANSACTIONS.items():
            smb_uuid = uuid.UUID(smb_id_str)
            if smb_uuid in existing_txns:
                logger.info("  Skip transactions for SMB %s (already seeded)", smb_id_str)
                continue
            for t in txns:
                if t["amount"] == 0:
                    continue
                session.add(Transaction(smb_id=smb_uuid, **t))
                txn_added += 1
        await session.commit()
        logger.info("Transactions: %d added", txn_added)

        # ── Leads ──
        existing_leads = {r[0] for r in (await session.execute(select(Lead.id))).all()}
        lead_added = 0
        for data in MOCK_LEADS:
            if data["id"] not in existing_leads:
                session.add(Lead(**data))
                lead_added += 1
                logger.info("  Added Lead: %s status=%s", data["id"], data["status"])
        await session.commit()
        logger.info("Leads: %d added", lead_added)

        # ── Lead Events ──
        existing_events = {r[0] for r in (await session.execute(select(LeadEvent.lead_id))).all()}
        event_added = 0
        for data in MOCK_LEAD_EVENTS:
            if data["lead_id"] not in existing_events:
                session.add(LeadEvent(**data))
                event_added += 1
        await session.commit()
        logger.info("Lead events: %d added", event_added)

        # ── Banker Notes ──
        existing_notes_count = (await session.execute(select(BankerNote))).scalars().all()
        if not existing_notes_count:
            for data in MOCK_NOTES:
                session.add(BankerNote(**data))
            await session.commit()
            logger.info("Banker notes: %d added", len(MOCK_NOTES))

    # ── Redis phone mappings ──
    logger.info("Seeding Redis phone mappings...")
    for data in MOCK_SMBS:
        await set_phone_mapping(data["phone"], str(data["id"]))
        logger.info("  Redis: %s -> %s", data["phone"], data["id"])

    logger.info("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
