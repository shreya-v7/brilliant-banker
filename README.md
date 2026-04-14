# Brilliant Banker

AI-powered banking assistant that serves **two users simultaneously**: SMB owners get an always-on financial advisor inside the PNC mobile app, and Relationship Managers get a CRM dashboard with AI-generated pre-call briefs, warm leads ranked by urgency, and one-tap credit decisions.

---

## The Problem

PNC has **928K SMB client relationships** across 2,200 branches served by **596 bankers**. That's ~354 SMBs per branch manager — and only **35% get contacted in 2 years**. Hiring more bankers doesn't fix the math. Three consequences:

- **$66K fraud undetected** — Carroll case, 4 months before discovery
- **Credit denied blindly** — Fox (800+ score) waited 4 weeks with no outreach
- **Deposits leaving to Square** — Valentina, active customer, moving money to a competitor

**AI is the only solution that scales insight to 796K clients simultaneously while alerting humans when action is needed.**

---

## Production Architecture (Target)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: Data Sources (PNC existing infrastructure)                    │
│  Transactions │ Accounts │ Call transcripts │ Industry codes            │
│  Event hub │ Agentic platform                                           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 2: Intelligence Engine                                           │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Seasonal ML  │ │ Cash flow    │ │ Credit       │ │ Anomaly      │   │
│  │ STL/Prophet  │ │ XGBoost/LSTM │ │ pre-qual     │ │ detection    │   │
│  │              │ │              │ │ LogReg/GBM   │ │ Isol. forest │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                         │
│  Peer benchmark (928K) │ External signals (NOAA) │ Feature store (Feast)│
│  LLM composer (Anthropic + PNC compliance guardrails)                   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Decision + Routing Engine                                     │
│  Priority ranking │ Channel routing │ Alert timing │ Dual-side bridge   │
└────────┬─────────────────────┬─────────────────────┬───────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌────────────────┐   ┌──────────────┐   ┌────────────────────┐
│ SMB: PNC App   │   │   Bridge     │   │ Banker: CRM        │
│ Cash forecast  │   │ Alerts both  │   │ Pre-call brief     │
│ Credit pre-qual│   │ sides at     │   │ Warm leads         │
│ Product recs   │   │ once         │   │ Risk flags         │
│ AI chat        │   │              │   │ Multi-entity       │
└────────────────┘   └──────────────┘   └────────────────────┘

         ┌──────────────────────────────────────────┐
         │  Layer 4: Security & Compliance           │
         │  Biometric │ PII masking │ Audit logging  │
         │  ECOA/TCPA compliance │ Explainable AI    │
         └──────────────────────────────────────────┘

         ┌──────────────────────────────────────────┐
         │  Layer 5: Flywheel                        │
         │  Every interaction enriches data layer.   │
         │  Response rates, call outcomes, seasonal  │
         │  corrections feed back to improve models. │  ← loops to Layer 1
         └──────────────────────────────────────────┘
```

### Production Tech Stack

| Layer | Technology |
|-------|-----------|
| Data pipeline | Kafka event hub, batch+stream processing |
| ML models | Prophet/STL (seasonal), XGBoost/LSTM (cash flow), LogReg/GBM (credit), Isolation forest (anomaly) |
| Feature store | Feast/Tecton with Redis cache |
| LLM | Anthropic Claude with PNC compliance guardrails |
| Databases | PostgreSQL (relational), Redis (caching + pub/sub), MongoDB (conversations) |
| Monitoring | Prometheus + Grafana |
| Deployment | Kubernetes, CI/CD, blue-green deploys |

---

## What This Prototype Implements

This repo is a **working proof-of-concept** that demonstrates the full user experience with simplified infrastructure. The AI pipeline, UI, and business logic are production-representative — only the data layer is simplified for zero-config deployment.

```
React App → POST /api/chat → LangGraph Agent → Claude → Response
                                │
                                ├─ intent_classifier (Claude)
                                ├─ tool_router → cash_flow / credit_prequal / faq / escalate
                                ├─ reply_composer (Claude)
                                └─ escalation_checker (auto-escalate >$10K)
```

### POC vs Production

| Component | Production | This POC |
|-----------|-----------|----------|
| Relational data | PostgreSQL 16 | **SQLite** (file-based, auto-created) |
| Session/cache | Redis 7 | **In-memory Python dict** |
| Real-time events | Redis pub/sub / Kafka | **In-memory asyncio broadcast** |
| Chat history | MongoDB 7 | **SQLite table** (same DB file) |
| ML models | XGBoost, Prophet, Isolation Forest | **Rule-based** (stability × history × revenue) |
| LLM | Claude with compliance guardrails | **Claude** (same, no guardrails) |
| Auth | Biometric + OAuth | **Mock login** (pick a demo user) |
| Deployment | Kubernetes cluster | **Single Railway service** |
| Data | 928K real clients | **5 seeded demo SMBs** |

**What's real:** The LangGraph 4-node AI pipeline, Claude integration, full SMB + Banker UIs, credit pre-qualification scoring, auto-escalation logic, real-time SSE event stream, and append-only decision audit trail.

---

## Implementation Roadmap (18 months)

### Phase 1: Data Foundation (months 1–3)

| Component | Details | Tech |
|-----------|---------|------|
| Transaction pipeline | Wire event hub into feature store. Rolling aggregates (7d, 30d, 90d, YoY). | Kafka, batch+stream |
| Seasonal decomposition | Decompose 3+ year histories into trend, seasonal, residual. | Prophet/STL, 928K clients |
| Feature store | Centralized registry: seasonality index, cash runway, peer percentile. | Feast/Tecton, Redis cache |

### Phase 2: Cash Flow MVP (months 3–6)

| Component | Details | Tech |
|-----------|---------|------|
| 90-day forecaster | Forward projection with confidence bands. Best/middle/worst scenarios. | XGBoost, daily retrain |
| In-app AI chat | Embedded in PNC mobile app. Conversational interface for forecasts. | LLM API, PNC SDK |
| Banker CRM v1 | Pre-call brief for pilot bankers. Client health, seasonal flags. | React, REST API |
| Pilot: 1,000 SMBs | Seasonal businesses first. Target: 20% MAPE. Shadow mode 90 days. | Fox, Valentina, Kayla |

### Phase 3: Full Intelligence (months 6–12)

| Component | Details | Tech |
|-----------|---------|------|
| Credit pre-qual | Transaction-based scoring. Explainable model for ECOA. | Logistic reg, OCC review |
| Anomaly detection | Real-time fraud alerts. Prevents Carroll $66K scenario. | Isolation forest, Flink |
| Bridge alerts | Dual notification: owner + banker simultaneously. | Event router, Push API |

### Phase 4: Scale to ~796K (months 12–18)

| Component | Details |
|-----------|---------|
| Full rollout | From 1K pilot to 796K. Regional: Midwest first, then NE, SE, SW. |
| Flywheel | Send-time optimization. Seasonal correction. Playbook quality scoring. |
| Success metrics | NPS lift. Product penetration 81%→85%. Lending 9%→15%+. Contact rate 35%→65%+. |

### Investment & Risk

| Category | Requirement | Mitigation |
|----------|-------------|------------|
| Team | 7–10 hires: 3-5 ML, 1-2 conversational AI, 1 UX | Small vs Chase $18B. Focused team. |
| Accuracy | Forecast must be under 20% MAPE | BofA CashPro proves approach. 90-day shadow mode. |
| Regulatory | Credit pre-qual under ECOA / OCC AI guidance | Explainable models. "Informational" framing. |
| Addressable | ~796K × $6,765 = ~$5.4B within PNC base | 5% adoption lift = ~$269M. |

---

## Pricing & Revenue Model

### SMB Pricing — Designed for Small Business Affordability

The AI advisor is bundled into PNC business accounts at tiers that make sense relative to what SMBs already pay for banking. No separate software purchase — it's a banking feature, not a SaaS product.

| Tier | Who | Monthly Cost | What They Get |
|------|-----|-------------|---------------|
| **Starter** (free) | All 928K PNC business checking customers | $0 | AI chat (5 msgs/day), basic cash flow snapshot, FAQ support, branch hours/rates lookup |
| **Insights** | SMBs with $10K+ avg monthly balance | $29/mo | Unlimited AI chat, 90-day cash flow forecast, credit pre-qualification check, spending category breakdown, peer benchmarking |
| **Advisor** | SMBs with $50K+ avg monthly balance or existing credit | $79/mo | Everything in Insights + dedicated RM priority queue, proactive anomaly alerts, seasonal business planning, product recommendations, AI-drafted quarterly business review |

**Why this works for SMBs:**
- **Free tier creates trust.** 928K clients can try the AI advisor at zero risk. The chat alone saves a phone call to the branch (avg $12/call for PNC, avg 15 min wait for client). Both sides win.
- **$29/mo is cheaper than a bookkeeper.** A fractional bookkeeper costs $200-500/mo. For $29, an SMB gets real-time cash forecasting and credit readiness — the two things they'd actually call their accountant about.
- **$79/mo replaces a financial advisor call.** Small business financial advisory starts at $150-300/hr. The Advisor tier provides always-on monitoring that a quarterly advisor meeting never could.
- **Balance requirements align incentives.** Higher tiers require keeping money at PNC — deeper deposits fund PNC's lending, and the SMB gets smarter tools in return.

### What the SMB Gets Back (ROI)

| Scenario | Without Brilliant Banker | With Brilliant Banker | SMB Savings |
|----------|------------------------|----------------------|-------------|
| Cash flow surprise | Overdraft fees avg $35/incident, 3x/year = $105 | AI warns 7 days ahead, zero overdrafts | **$105/year saved** |
| Credit application | 4-week wait, manual paperwork, maybe declined | Pre-qual in 10 seconds, knows eligibility before applying | **Hours saved, no wasted applications** |
| Fraud/anomaly | Carroll: $66K lost over 4 months | AI flags unusual vendor in <24 hours | **Potentially thousands saved** |
| Banker relationship | 35% chance of contact in 2 years | Automatic priority routing, RM calls when it matters | **Actually has a relationship manager** |
| Tax season prep | $500+ bookkeeper bill for transaction categorization | Auto-categorized spending, exportable reports | **$200-400/year saved** |

> A Starter-tier SMB saves more in avoided overdraft fees than the cost of upgrading to Insights.

### PNC Revenue Streams

| Stream | Year 1 (Pilot) | Year 3 (Scale) | How |
|--------|---------------|-----------------|-----|
| **Subscription revenue** | $1.2M | $48M | 5% of 928K upgrade to Insights ($29) + 1% to Advisor ($79) |
| **Deposit deepening** | $8M | $180M | Balance requirements pull deposits from Square/Stripe back to PNC. $50K avg balance × interest margin. |
| **Lending conversion** | $12M | $340M | Credit pre-qual surfaces qualified borrowers the bank currently misses. 9%→15% lending penetration on $5.4B addressable. |
| **Reduced attrition** | $3M | $65M | 1% reduction in SMB churn = ~9,280 retained clients × $6,765 avg revenue. AI engagement creates switching cost. |
| **Operational savings** | $2M | $25M | 35% reduction in branch call volume for routine questions. Each AI chat replaces a $12 branch interaction. |
| **Cross-sell uplift** | $1M | $40M | Product awareness is 18% today. AI surfaces relevant products (merchant services, payroll, insurance) in context. |
| **Total** | **~$27M** | **~$698M** | Conservative: assumes only PNC existing base, no new acquisition. |

### PNC Technology Cost to Build & Run

| Category | Year 1 | Year 2 | Year 3 (steady state) | Notes |
|----------|--------|--------|----------------------|-------|
| **Team** | $2.4M | $2.8M | $3.0M | 7-10 engineers: 3-5 ML, 1-2 conversational AI, 1 streaming, 1 UX. Avg $280K fully loaded. |
| **LLM API (Claude)** | $180K | $420K | $800K | ~$0.03/conversation × volume. Scales with adoption. Negotiable at enterprise volume. |
| **Cloud infra** | $240K | $360K | $480K | Kubernetes, PostgreSQL, Redis, Kafka, feature store. Mostly incremental on PNC's existing 5/6 building blocks. |
| **ML training & compute** | $120K | $200K | $250K | Daily model retraining (XGBoost, Prophet). GPU for LSTM. Feature store maintenance. |
| **Compliance & audit** | $150K | $100K | $80K | ECOA review, OCC AI guidance alignment, explainability testing. Front-loaded in Year 1. |
| **Third-party data** | $60K | $80K | $100K | NOAA (weather/seasonal), industry benchmarks, external signals for anomaly detection. |
| **Total** | **$3.15M** | **$3.96M** | **$4.71M** | |
| **Revenue** | $27M | $180M | $698M | |
| **ROI** | **8.6x** | **45x** | **148x** | |

> **Payback period: ~6 months** from Phase 2 launch (month 6). Subscription + lending conversion alone cover the full tech cost by month 9.

### Why This Pricing Beats Competitors

| Competitor | What they charge SMBs | What Brilliant Banker does better |
|-----------|----------------------|----------------------------------|
| QuickBooks Cash Flow | $30/mo (standalone tool) | Embedded in banking — no separate login, real transaction data, not manual entry |
| Nav.ai (credit monitoring) | $20-40/mo | PNC has the actual underwriting data. Pre-qual here means something. |
| Mercury AI | Free (but requires switching banks) | No switching cost. Works inside PNC where the money already is. |
| Brex AI | Enterprise only ($0 for startups, $12/user otherwise) | Available to all 928K SMBs, not just tech startups. Includes human banker bridge. |
| Standalone financial advisor | $150-300/hr | Always-on, $0-79/mo, learns from every interaction. 24/7 availability. |

---

## App Screens

### SMB Owner (mobile)

| Screen | What it does |
|--------|-------------|
| **Login** | Role picker (Business Owner vs PNC Banker), then profile selector |
| **Dashboard** | Balances, 30-day cash flow, recent transactions, AI assistant card |
| **Chat** | AI chatbot with typing indicator, intent badges, suggested prompts, RM card on escalation |
| **Activity** | Track credit requests — filter by status, expand for details, see RM notifications |
| **Profile** | Business details, financial stats, AI business brief |

### Banker / RM (desktop)

| Screen | What it does |
|--------|-------------|
| **Dashboard** | Portfolio metrics, credit pipeline, priority queue, health donut, at-risk clients |
| **My Clients** | All SMBs sorted by stability, drill into full profile |
| **Credit Review** | Pending leads with AI pre-call brief, conversation playbook, approve/decline/refer |
| **Client Profile** | 4-tab view: Overview, Transactions, Credit History, Banker Notes |

---

## Setup (local dev)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY

# 2. Start backend
cd backend
pip install -r requirements.txt
cd ..
uvicorn backend.main:app --reload --port 8000

# 3. Start frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**. Demo data auto-seeds on first startup.

---

## Deploy to Railway

Single service, zero database setup — just one env var.

1. Go to [railway.app](https://railway.app) → create project → **"+ New"** → **"GitHub Repo"** → select this repo
2. Railway detects `railway.json` and builds automatically
3. Go to **Variables** tab → add `ANTHROPIC_API_KEY`
4. Go to **Settings** → generate a public domain
5. Visit your `https://*.up.railway.app` URL — auto-seeds demo data on first boot

**Cost:** Railway free tier + ~$0.02-0.05 per conversation in Anthropic API calls.

---

## Demo Walkthrough

### End-to-End Story

1. **SMB side** — Log in as Melissa Murphy (restaurant owner), open Chat, ask for a $35K credit line
2. **AI escalates** — LangGraph detects amount > $10K, runs pre-qual, creates lead with urgency 0.85
3. **Banker side** — Log in as Sarah Chen, see Melissa at #1 in Priority Queue
4. **Review** — Open Credit Review, read AI brief, review playbook
5. **Decide** — Approve with amount; Claude drafts approval notification
6. **SMB sees result** — Melissa's Activity tab shows "approved" with notification text

Tap the floating **Demo** button on any screen for a guided step-by-step walkthrough.

---

## Project Structure

```
brilliant-banker/
├── Dockerfile.railway         # Production build (frontend + backend in one image)
├── railway.json               # Railway deployment config
├── .env.example               # Just needs ANTHROPIC_API_KEY
├── frontend/
│   ├── package.json
│   ├── vite.config.js         # Dev proxy → localhost:8000
│   ├── tailwind.config.js     # PNC brand colors (navy + orange)
│   └── src/
│       ├── App.jsx            # Role-based routing (SMB vs Banker)
│       ├── api.js             # All API calls + SSE stream
│       ├── components/        # Layout shells, nav bars, demo guide, SSE feed
│       └── pages/
│           ├── Login.jsx      # Role picker + profile selector
│           ├── Dashboard.jsx  # SMB home
│           ├── Chat.jsx       # AI chatbot
│           ├── Activity.jsx   # Credit request tracker
│           ├── Profile.jsx    # Business profile + AI brief
│           └── banker/        # 5 banker screens (dashboard, clients, credit, profile, SMB detail)
└── backend/
    ├── main.py                # FastAPI app, lifespan, static file serving
    ├── requirements.txt       # 12 dependencies
    ├── agent/
    │   ├── graph.py           # LangGraph 4-node pipeline
    │   ├── tools.py           # cash_flow, credit_prequal, faq, escalate
    │   └── prompts.py         # All Claude prompts
    ├── services/
    │   ├── claude_service.py  # Anthropic Claude wrapper
    │   ├── notify_service.py  # Decision notification drafting
    │   └── stream_service.py  # In-memory pub/sub for SSE
    ├── db/
    │   ├── database.py        # SQLAlchemy models + SQLite engine (7 tables)
    │   ├── conversations.py   # Chat history (SQLite)
    │   └── phone_map.py       # In-memory session mapping
    ├── models/
    │   └── schemas.py         # Pydantic models + Settings
    ├── routers/
    │   ├── chat.py            # POST /api/chat + auth endpoints
    │   ├── banker.py          # Portfolio, leads, decisions, notes
    │   ├── smb.py             # SMB profile + transactions + escalations
    │   └── stream.py          # GET /banker/stream (SSE)
    └── seed/
        └── seed_data.py       # 5 SMBs, 3 bankers, 80+ transactions, leads, notes
```

---

## Design Decisions

- **PNC brand theme**: Navy (#002D5F) and orange (#E35205), mobile-first responsive layout
- **Append-only audit trail**: `lead_events` table records every banker action
- **All AI responses via Claude**: Chat replies, decision notifications, business briefs — no hardcoded strings
- **Auto-escalation**: Credit requests over $10K automatically create a banker lead
- **Multi-turn context**: Last 10 messages provide conversational continuity
- **Zero-config deployment**: SQLite + in-memory stores — no external databases needed for POC
- **Real-time RM stream**: In-memory asyncio broadcast powers SSE so bankers see live client activity
