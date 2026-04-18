"""
Seed mock data into SQLite.

Run from project root:
    python -m backend.seed.seed_data
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update

from backend.db.database import (
    Base, SMB, Banker, Lead, LeadEvent, Transaction, BankerNote,
    engine, async_session, init_db,
)
from backend.db.phone_map import set_phone_mapping

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ── Demo bankers ──────────────────────────────────────────────────────────────

# Sarah = guided walkthrough / skit RM only. All others = user testing & default login (no overlap).
MOCK_BANKERS = [
    {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "name": "Sarah Chen",
        "title": "Senior Business Banking Advisor",
        "region": "Northeast",
        "email": "sarah.chen@pnc.com",
    },
    {
        "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "name": "Marcus Williams",
        "title": "SMB Relationship Manager",
        "region": "Southeast",
        "email": "marcus.williams@pnc.com",
    },
    {
        "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "name": "Jordan Patel",
        "title": "Business Credit Specialist",
        "region": "Midwest",
        "email": "jordan.patel@pnc.com",
    },
    {
        "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "name": "Elena Vasquez",
        "title": "Vice President, Business Banking",
        "region": "Southwest",
        "email": "elena.vasquez@pnc.com",
    },
    {
        "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        "name": "James Okonkwo",
        "title": "Relationship Manager, Business Banking",
        "region": "West",
        "email": "james.okonkwo@pnc.com",
    },
]

# ── SMB owners ────────────────────────────────────────────────────────────────

MOCK_SMBS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Maya Patel",
        "business_type": "Floral design",
        "annual_revenue": 1_200_000,
        "avg_monthly_revenue": 98_000,
        "cash_stability": 0.72,
        "payment_history": 0.88,
        "phone": "+14151110001",
        "assigned_banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "name": "Priya Rao",
        "business_type": "Dry cleaning",
        "annual_revenue": 532_000,
        "avg_monthly_revenue": 44_000,
        "cash_stability": 0.61,
        "payment_history": 0.79,
        "phone": "+14151110002",
        "assigned_banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "name": "Aarav Singh",
        "business_type": "Café & catering",
        "annual_revenue": 680_000,
        "avg_monthly_revenue": 56_000,
        "cash_stability": 0.45,
        "payment_history": 0.82,
        "phone": "+14151110003",
        "assigned_banker_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    },
    {
        "id": "44444444-4444-4444-4444-444444444444",
        "name": "Nadia Okonkwo",
        "business_type": "Tour services",
        "annual_revenue": 490_000,
        "avg_monthly_revenue": 41_000,
        "cash_stability": 0.38,
        "payment_history": 0.75,
        "phone": "+14151110004",
        "assigned_banker_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    },
    {
        "id": "55555555-5555-5555-5555-555555555555",
        "name": "Ethan Park",
        "business_type": "Consulting",
        "annual_revenue": 85_000,
        "avg_monthly_revenue": 7_000,
        "cash_stability": 0.91,
        "payment_history": 0.95,
        "phone": "+14151110005",
        "assigned_banker_id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    },
]

# ── Transactions per SMB (last 30 days) ───────────────────────────────────────

def days_ago(n): return datetime.now() - timedelta(days=n)

MOCK_TRANSACTIONS = {
    "11111111-1111-1111-1111-111111111111": [
        {"description": "Wholesale Flowers - Supplier A", "amount": -8_400, "category": "supplies", "txn_date": days_ago(1)},
        {"description": "Wedding Event - Private Client", "amount": 12_500, "category": "revenue", "txn_date": days_ago(2)},
        {"description": "Payroll - Payroll Provider", "amount": -14_200, "category": "payroll", "txn_date": days_ago(3)},
        {"description": "Corporate Account - Client B", "amount": 6_800, "category": "revenue", "txn_date": days_ago(5)},
        {"description": "E-Commerce Platform", "amount": -79, "category": "software", "txn_date": days_ago(6)},
        {"description": "Delivery - Shipping Service", "amount": -340, "category": "supplies", "txn_date": days_ago(7)},
        {"description": "Event - Gala Centerpieces", "amount": 9_200, "category": "revenue", "txn_date": days_ago(9)},
        {"description": "Refrigeration Repair", "amount": -2_100, "category": "maintenance", "txn_date": days_ago(11)},
        {"description": "Retail Walk-in Sales", "amount": 3_450, "category": "revenue", "txn_date": days_ago(12)},
        {"description": "Accounting Software", "amount": -85, "category": "software", "txn_date": days_ago(14)},
        {"description": "Funeral Home - Local Partner", "amount": 4_100, "category": "revenue", "txn_date": days_ago(16)},
        {"description": "Payroll - Payroll Provider", "amount": -14_200, "category": "payroll", "txn_date": days_ago(17)},
        {"description": "Wholesale Flowers - Supplier A", "amount": -7_800, "category": "supplies", "txn_date": days_ago(19)},
        {"description": "Hotel Contract - Hospitality Partner", "amount": 8_900, "category": "revenue", "txn_date": days_ago(21)},
        {"description": "Utility - Electric & Gas", "amount": -620, "category": "utilities", "txn_date": days_ago(23)},
        {"description": "Retail Walk-in Sales", "amount": 2_870, "category": "revenue", "txn_date": days_ago(25)},
        {"description": "Insurance - Business Policy", "amount": -540, "category": "insurance", "txn_date": days_ago(28)},
        {"description": "Payroll - Payroll Provider", "amount": -14_200, "category": "payroll", "txn_date": days_ago(31)},
    ],
    "22222222-2222-2222-2222-222222222222": [
        {"description": "Commercial Lease - Main St", "amount": -3_800, "category": "rent", "txn_date": days_ago(1)},
        {"description": "Daily Drop-off Revenue", "amount": 2_100, "category": "revenue", "txn_date": days_ago(1)},
        {"description": "Cleaning Chemicals - Supplier", "amount": -1_240, "category": "supplies", "txn_date": days_ago(3)},
        {"description": "Corporate Accounts - Office Client", "amount": 4_500, "category": "revenue", "txn_date": days_ago(4)},
        {"description": "Payroll - Payroll Provider", "amount": -8_600, "category": "payroll", "txn_date": days_ago(5)},
        {"description": "Daily Drop-off Revenue", "amount": 1_950, "category": "revenue", "txn_date": days_ago(6)},
        {"description": "Equipment Maintenance", "amount": -890, "category": "maintenance", "txn_date": days_ago(8)},
        {"description": "Daily Drop-off Revenue", "amount": 2_340, "category": "revenue", "txn_date": days_ago(9)},
        {"description": "Utility - Electric", "amount": -1_100, "category": "utilities", "txn_date": days_ago(10)},
        {"description": "Hotel Contract - Hospitality Client", "amount": 3_200, "category": "revenue", "txn_date": days_ago(12)},
        {"description": "Payroll - Payroll Provider", "amount": -8_600, "category": "payroll", "txn_date": days_ago(19)},
        {"description": "Insurance Renewal", "amount": -1_800, "category": "insurance", "txn_date": days_ago(22)},
        {"description": "Daily Drop-off Revenue", "amount": 2_050, "category": "revenue", "txn_date": days_ago(24)},
        {"description": "New Press Machine - Equipment Vendor", "amount": -12_000, "category": "equipment", "txn_date": days_ago(26)},
        {"description": "Daily Drop-off Revenue", "amount": 1_780, "category": "revenue", "txn_date": days_ago(28)},
    ],
    "33333333-3333-3333-3333-333333333333": [
        {"description": "Food Supplier - Vendor A", "amount": -6_800, "category": "supplies", "txn_date": days_ago(1)},
        {"description": "Daily Service Revenue", "amount": 4_200, "category": "revenue", "txn_date": days_ago(1)},
        {"description": "Payroll - Payroll Provider", "amount": -18_400, "category": "payroll", "txn_date": days_ago(3)},
        {"description": "Lunch Service Revenue", "amount": 1_950, "category": "revenue", "txn_date": days_ago(3)},
        {"description": "Online Order Settlement", "amount": 3_100, "category": "revenue", "txn_date": days_ago(5)},
        {"description": "Lease - Commercial Space", "amount": -7_200, "category": "rent", "txn_date": days_ago(6)},
        {"description": "Food Supplier - Vendor A", "amount": -5_900, "category": "supplies", "txn_date": days_ago(8)},
        {"description": "Evening Service Revenue", "amount": 5_800, "category": "revenue", "txn_date": days_ago(8)},
        {"description": "NSF Fee - Overdraft", "amount": -35, "category": "fees", "txn_date": days_ago(9)},
        {"description": "Catering - Private Event", "amount": 3_400, "category": "revenue", "txn_date": days_ago(11)},
        {"description": "Kitchen Equipment Repair", "amount": -3_200, "category": "maintenance", "txn_date": days_ago(13)},
        {"description": "Payroll - Payroll Provider", "amount": -18_400, "category": "payroll", "txn_date": days_ago(17)},
        {"description": "Daily Service Revenue", "amount": 4_600, "category": "revenue", "txn_date": days_ago(17)},
        {"description": "POS System - Payment Processor", "amount": -89, "category": "software", "txn_date": days_ago(20)},
        {"description": "Utility - Gas & Electric", "amount": -2_100, "category": "utilities", "txn_date": days_ago(22)},
        {"description": "Missed Payment - NSF", "amount": -35, "category": "fees", "txn_date": days_ago(24)},
        {"description": "Weekend Event Revenue", "amount": 3_900, "category": "revenue", "txn_date": days_ago(25)},
        {"description": "Food Supplier - Vendor B", "amount": -6_200, "category": "supplies", "txn_date": days_ago(27)},
    ],
    "44444444-4444-4444-4444-444444444444": [
        {"description": "Tour Bookings - April", "amount": 5_200, "category": "revenue", "txn_date": days_ago(2)},
        {"description": "Fleet Maintenance", "amount": -2_800, "category": "maintenance", "txn_date": days_ago(4)},
        {"description": "Payroll - Seasonal Staff", "amount": -9_100, "category": "payroll", "txn_date": days_ago(5)},
        {"description": "Tour Bookings - Online", "amount": 3_800, "category": "revenue", "txn_date": days_ago(6)},
        {"description": "Storage Unit Rental", "amount": -450, "category": "rent", "txn_date": days_ago(7)},
        {"description": "Equipment Parts - Supplier", "amount": -1_200, "category": "supplies", "txn_date": days_ago(9)},
        {"description": "Partner Commission - Hospitality", "amount": 1_900, "category": "revenue", "txn_date": days_ago(11)},
        {"description": "Offline - No Revenue", "amount": 0, "category": "note", "txn_date": days_ago(12)},
        {"description": "Insurance - Business Fleet", "amount": -2_400, "category": "insurance", "txn_date": days_ago(14)},
        {"description": "Tour Bookings - Weekend", "amount": 4_100, "category": "revenue", "txn_date": days_ago(15)},
        {"description": "Payroll - Seasonal Staff", "amount": -9_100, "category": "payroll", "txn_date": days_ago(19)},
        {"description": "Website Hosting", "amount": -23, "category": "software", "txn_date": days_ago(20)},
        {"description": "Tour Cancellation Refund", "amount": -1_800, "category": "refund", "txn_date": days_ago(22)},
        {"description": "Corporate Group Booking", "amount": 6_400, "category": "revenue", "txn_date": days_ago(24)},
        {"description": "NSF - Payment Bounced", "amount": -35, "category": "fees", "txn_date": days_ago(26)},
    ],
    "55555555-5555-5555-5555-555555555555": [
        {"description": "Client Retainer - March", "amount": 2_800, "category": "revenue", "txn_date": days_ago(1)},
        {"description": "Accounting Software - Pro", "amount": -180, "category": "software", "txn_date": days_ago(3)},
        {"description": "Client Retainer - Acct 201", "amount": 1_400, "category": "revenue", "txn_date": days_ago(4)},
        {"description": "Home Office Expenses", "amount": -320, "category": "overhead", "txn_date": days_ago(6)},
        {"description": "Client Retainer - Acct 202", "amount": 950, "category": "revenue", "txn_date": days_ago(8)},
        {"description": "Professional Development", "amount": -450, "category": "education", "txn_date": days_ago(10)},
        {"description": "Client Retainer - April", "amount": 2_800, "category": "revenue", "txn_date": days_ago(15)},
        {"description": "Accounting Platform", "amount": -72, "category": "software", "txn_date": days_ago(16)},
        {"description": "Tax Filing Client - 1099s", "amount": 600, "category": "revenue", "txn_date": days_ago(18)},
        {"description": "Client Retainer - New Account", "amount": 1_200, "category": "revenue", "txn_date": days_ago(22)},
        {"description": "CPA License Renewal", "amount": -290, "category": "overhead", "txn_date": days_ago(25)},
        {"description": "Client Retainer - Acct 203", "amount": 1_100, "category": "revenue", "txn_date": days_ago(28)},
    ],
}

# ── Demo leads (some pending for the demo) ────────────────────────────────────

MOCK_LEADS = [
    {
        "id": "1ead1111-1111-1111-1111-111111111111",
        "smb_id": "33333333-3333-3333-3333-333333333333",
        "assigned_banker_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "status": "pending",
        "requested_amount": 35_000,
        "credit_score": 0.64,
        "urgency_score": 0.85,
        "reason": "Requesting $35K line of credit to cover payroll gap and emergency kitchen repair. Cash flow has been strained by lower-than-expected foot traffic this quarter.",
    },
    {
        "id": "2ead2222-2222-2222-2222-222222222222",
        "smb_id": "44444444-4444-4444-4444-444444444444",
        "assigned_banker_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "status": "pending",
        "requested_amount": 20_000,
        "credit_score": 0.57,
        "urgency_score": 0.72,
        "reason": "Seasonal business needs bridge financing to purchase new tour equipment before peak summer season. Bookings are up 40% YoY but cash reserves are low.",
    },
    {
        "id": "3ead3333-3333-3333-3333-333333333333",
        "smb_id": "22222222-2222-2222-2222-222222222222",
        "assigned_banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "status": "approved",
        "requested_amount": 15_000,
        "credit_score": 0.71,
        "urgency_score": 0.55,
        "reason": "Equipment upgrade - new commercial press machine to expand capacity.",
    },
    {
        "id": "4ead4444-4444-4444-4444-444444444444",
        "smb_id": "22222222-2222-2222-2222-222222222222",
        "assigned_banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "status": "referred",
        "requested_amount": 120_000,
        "credit_score": 0.82,
        "urgency_score": 0.4,
        "reason": "Expansion financing for second location and equipment. Reviewing SBA loan options.",
    },
    {
        "id": "5ead5555-5555-5555-5555-555555555555",
        "smb_id": "11111111-1111-1111-1111-111111111111",
        "assigned_banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "status": "declined",
        "requested_amount": 28_000,
        "credit_score": 0.58,
        "urgency_score": 0.64,
        "reason": "$28K seasonal working capital line; RM Sarah Chen escalated with winter stress-test notes; UW declined.",
    },
]

MOCK_LEAD_EVENTS = [
    {
        "lead_id": "3ead3333-3333-3333-3333-333333333333",
        "action": "approved",
        "amount": 15_000,
        "banker_note": "Strong payment history and stable cash flow. Approved standard LOC.",
        "banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "sms_sent": "Great news! Your $15,000 line of credit has been approved. You can access funds through your PNC account within 24 hours.",
    },
    {
        "lead_id": "4ead4444-4444-4444-4444-444444444444",
        "action": "referred",
        "amount": 120_000,
        "banker_note": "Great profile but amount requires SBA review. Referring to specialist team.",
        "banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "sms_sent": "Your expansion financing request is being reviewed by our SBA specialist team. Your RM will call within 24 hours to walk you through your options.",
    },
    {
        "lead_id": "5ead5555-5555-5555-5555-555555555555",
        "action": "declined",
        "amount": 28_000,
        "banker_note": "RM advocated; UW: modeled Jan-Feb coverage fell to 1.09x vs 1.15x policy on $28K structure.",
        "banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "sms_sent": (
            "Update on your $28,000 seasonal working capital line for Bloom & Stem: Brilliant Banker's "
            "instant check looked fine, so we moved you to manual underwriting for the winter slow season. "
            "We stress-tested January through February against your 2024 deposits and wedding/event pipeline. "
            "At the advance and payment schedule you chose, debt service coverage in those eight weeks "
            "landed at about 1.09x, under our 1.15x floor, mostly because floral revenue in that window "
            "runs roughly 36% below your trailing-twelve average. We are not able to approve this structure "
            "right now. Sarah Chen left you a path: reapply after three straight months with average daily "
            "balances above $41,000, or the same line with a 15% larger seasonal payment in Q1. Nothing else "
            "is due from you today; the full letter is in Activity."
        ),
    },
]

MOCK_NOTES = [
    {
        "smb_id": "33333333-3333-3333-3333-333333333333",
        "banker_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "note": "Called Aarav 4/2. Kitchen repair hurt March numbers badly. Strong customer retention, just needs bridge financing. Follow up on LOC application status.",
    },
    {
        "smb_id": "44444444-4444-4444-4444-444444444444",
        "banker_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "note": "Nadia has excellent tour reviews online. Seasonal pattern is normal for tour services. Equipment purchase is strategic  - consider approving with seasonal repayment schedule.",
    },
    {
        "smb_id": "11111111-1111-1111-1111-111111111111",
        "banker_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "note": "Maya: fought for the $28K seasonal line; UW declined on winter DSCR. She is executing the Q1 payment bump path we offered; revisit in 90 days.",
    },
]


async def seed():
    from pathlib import Path
    Path("data").mkdir(exist_ok=True)

    logger.info("Initializing database tables...")
    await init_db()

    async with async_session() as session:

        # ── Bankers first (SMB.assigned_banker_id references bankers.id) ──
        existing_bankers = {r[0] for r in (await session.execute(select(Banker.id))).all()}
        banker_added = 0
        for data in MOCK_BANKERS:
            if data["id"] not in existing_bankers:
                session.add(Banker(**data))
                banker_added += 1
                logger.info("  Added Banker: %s", data["name"])
        await session.commit()
        logger.info("Bankers: %d added", banker_added)

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

        for data in MOCK_SMBS:
            aid = data.get("assigned_banker_id")
            if aid:
                await session.execute(
                    update(SMB).where(SMB.id == data["id"]).values(assigned_banker_id=aid)
                )
        await session.commit()

        # ── Transactions ──
        existing_txns = {r[0] for r in (await session.execute(select(Transaction.smb_id))).all()}
        txn_added = 0
        for smb_id_str, txns in MOCK_TRANSACTIONS.items():
            if smb_id_str in existing_txns:
                logger.info("  Skip transactions for SMB %s (already seeded)", smb_id_str)
                continue
            for t in txns:
                if t["amount"] == 0:
                    continue
                session.add(Transaction(smb_id=smb_id_str, **t))
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

        for data in MOCK_LEADS:
            aid = data.get("assigned_banker_id")
            if aid:
                await session.execute(
                    update(Lead).where(Lead.id == data["id"]).values(assigned_banker_id=aid)
                )
        await session.commit()

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

    # ── Phone mappings (in-memory) ──
    logger.info("Seeding phone mappings...")
    for data in MOCK_SMBS:
        await set_phone_mapping(data["phone"], str(data["id"]))
        logger.info("  Phone: %s -> %s", data["phone"], data["id"])

    logger.info("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
