# Brilliant Banker

AI-powered banking assistant that serves **two users simultaneously**: SMB owners get an always-on financial advisor inside the PNC mobile app, and Relationship Managers get a CRM dashboard with AI-generated pre-call briefs, warm leads ranked by urgency, and one-tap credit decisions.

---

## The Problem

PNC has **928K SMB client relationships** across 2,200 branches served by **596 bankers**. That's ~354 SMBs per branch manager  - and only **35% get contacted in 2 years**. Hiring more bankers doesn't fix the math. Three consequences:

- **$66K fraud undetected**  - Carroll case, 4 months before discovery
- **Credit denied blindly**  - Fox (800+ score) waited 4 weeks with no outreach
- **Deposits leaving to Square**  - Valentina, active customer, moving money to a competitor

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

This repo is a **working proof-of-concept** that demonstrates the full user experience with simplified infrastructure. The AI pipeline, UI, and business logic are production-representative  - only the data layer is simplified for zero-config deployment.

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
| Deployment | Kubernetes cluster | **Hugging Face Space (Docker)** |
| Data | 928K real clients | **5 seeded demo SMBs** |

**What's real:** The LangGraph 4-node AI pipeline, Claude integration, full SMB + Banker UIs, credit pre-qualification scoring, auto-escalation logic, real-time SSE event stream, append-only decision audit trail, and user-testing feedback collection.

---

## Prototype Architecture (This Repo)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite)                                                  │
│  Role picker │ SMB mobile shell │ Banker CRM │ Walkthrough │ Feedback   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ REST + SSE (/api/*, /banker/stream)
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FastAPI (backend/main.py)                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ chat.py     │  │ banker.py    │  │ smb.py      │  │ feedback.py  │ │
│  │ auth + AI   │  │ leads/CRM    │  │ profiles    │  │ user testing │ │
│  └──────┬──────┘  └──────────────┘  └─────────────┘  └──────────────┘ │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LangGraph agent (graph.py)                                        │   │
│  │ intent_classifier → tool_router → reply_composer → escalation     │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
│                                 │ Claude API                             │
│  ┌──────────────────────────────┴───────────────────────────────────┐   │
│  │ SQLite (data/brilliantbanker.db)                                  │   │
│  │ SMBs, bankers, transactions, leads, lead_events, conversations,   │   │
│  │ banker_notes, user_feedback                                       │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│  In-memory: RM event stream (stream_service.py), session phone map       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech stack (POC)

| Layer | Stack |
|-------|--------|
| Frontend | React 18, Vite, Tailwind, React Router |
| Backend | FastAPI, Uvicorn, SQLAlchemy (async), aiosqlite |
| AI | LangGraph 4-node pipeline, Anthropic Claude |
| Database | SQLite file at `data/brilliantbanker.db` (auto-created + seeded) |
| Real-time | Server-Sent Events (`GET /banker/stream`) via in-memory pub/sub |
| Production deploy | Docker (`Dockerfile`) on Hugging Face Spaces (port 7860) |
| Local dev | Backend `:8000`, Vite frontend `:5173` (proxies API to backend) |

### AI chat pipeline

```
POST /api/chat
    → LangGraph agent
        ├─ intent_classifier (Claude)
        ├─ tool_router → cash_flow | credit_prequal | faq | escalate
        ├─ reply_composer (Claude)
        └─ escalation_checker (auto-escalate credit requests > $10K)
    → SSE event to banker stream (if escalated)
```

---

## Implementation Roadmap (18 months)

### Phase 1: Data Foundation (months 1 to 3)

| Component | Details | Tech |
|-----------|---------|------|
| Transaction pipeline | Wire event hub into feature store. Rolling aggregates (7d, 30d, 90d, YoY). | Kafka, batch+stream |
| Seasonal decomposition | Decompose 3+ year histories into trend, seasonal, residual. | Prophet/STL, 928K clients |
| Feature store | Centralized registry: seasonality index, cash runway, peer percentile. | Feast/Tecton, Redis cache |

### Phase 2: Cash Flow MVP (months 3 to 6)

| Component | Details | Tech |
|-----------|---------|------|
| 90-day forecaster | Forward projection with confidence bands. Best/middle/worst scenarios. | XGBoost, daily retrain |
| In-app AI chat | Embedded in PNC mobile app. Conversational interface for forecasts. | LLM API, PNC SDK |
| Banker CRM v1 | Pre-call brief for pilot bankers. Client health, seasonal flags. | React, REST API |
| Pilot: 1,000 SMBs | Seasonal businesses first. Target: 20% MAPE. Shadow mode 90 days. | Fox, Valentina, Kayla |

### Phase 3: Full Intelligence (months 6 to 12)

| Component | Details | Tech |
|-----------|---------|------|
| Credit pre-qual | Transaction-based scoring. Explainable model for ECOA. | Logistic reg, OCC review |
| Anomaly detection | Real-time fraud alerts. Prevents Carroll $66K scenario. | Isolation forest, Flink |
| Bridge alerts | Dual notification: owner + banker simultaneously. | Event router, Push API |

### Phase 4: Scale to ~796K (months 12 to 18)

| Component | Details |
|-----------|---------|
| Full rollout | From 1K pilot to 796K. Regional: Midwest first, then NE, SE, SW. |
| Flywheel | Send-time optimization. Seasonal correction. Playbook quality scoring. |
| Success metrics | NPS lift. Product penetration 81%→85%. Lending 9%→15%+. Contact rate 35%→65%+. |

### Investment & Risk

| Category | Requirement | Mitigation |
|----------|-------------|------------|
| Team | 7 to 10 hires: 3-5 ML, 1-2 conversational AI, 1 UX | Small vs Chase $18B. Focused team. |
| Accuracy | Forecast must be under 20% MAPE | BofA CashPro proves approach. 90-day shadow mode. |
| Regulatory | Credit pre-qual under ECOA / OCC AI guidance | Explainable models. "Informational" framing. |
| Addressable | ~796K × $6,765 = ~$5.4B within PNC base | 5% adoption lift = ~$269M. |

---

## Pricing & Revenue Model

### SMB Pricing  - Designed for Small Business Affordability

The AI advisor is bundled into PNC business accounts at tiers that make sense relative to what SMBs already pay for banking. No separate software purchase  - it's a banking feature, not a SaaS product.

| Tier | Who | Monthly Cost | What They Get |
|------|-----|-------------|---------------|
| **Starter** (free) | All 928K PNC business checking customers | $0 | AI chat (5 msgs/day), basic cash flow snapshot, FAQ support, branch hours/rates lookup |
| **Insights** | SMBs with $10K+ avg monthly balance | $29/mo | Unlimited AI chat, 90-day cash flow forecast, credit pre-qualification check, spending category breakdown, peer benchmarking |
| **Advisor** | SMBs with $50K+ avg monthly balance or existing credit | $79/mo | Everything in Insights + dedicated RM priority queue, proactive anomaly alerts, seasonal business planning, product recommendations, AI-drafted quarterly business review |

**Why this works for SMBs:**
- **Free tier creates trust.** 928K clients can try the AI advisor at zero risk. The chat alone saves a phone call to the branch (avg $12/call for PNC, avg 15 min wait for client). Both sides win.
- **$29/mo is cheaper than a bookkeeper.** A fractional bookkeeper costs $200-500/mo. For $29, an SMB gets real-time cash forecasting and credit readiness  - the two things they'd actually call their accountant about.
- **$79/mo replaces a financial advisor call.** Small business financial advisory starts at $150-300/hr. The Advisor tier provides always-on monitoring that a quarterly advisor meeting never could.
- **Balance requirements align incentives.** Higher tiers require keeping money at PNC  - deeper deposits fund PNC's lending, and the SMB gets smarter tools in return.

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
| QuickBooks Cash Flow | $30/mo (standalone tool) | Embedded in banking  - no separate login, real transaction data, not manual entry |
| Nav.ai (credit monitoring) | $20-40/mo | PNC has the actual underwriting data. Pre-qual here means something. |
| Mercury AI | Free (but requires switching banks) | No switching cost. Works inside PNC where the money already is. |
| Brex AI | Enterprise only ($0 for startups, $12/user otherwise) | Available to all 928K SMBs, not just tech startups. Includes human banker bridge. |
| Standalone financial advisor | $150-300/hr | Always-on, $0-79/mo, learns from every interaction. 24/7 availability. |

---

## App Screens

### Public / entry

| URL | Screen | Notes |
|-----|--------|-------|
| `/` | **Home** | Role picker; always accessible (no auto-redirect when signed in) |
| `/links` | **All screen URLs** | Copyable deep links for every route |
| `/scene` | **Customer discovery skit** | Maya & Priya story; optional entry to SMB app |
| `/marketing` | **Marketing page** | Product overview |

### Sign-in (pick a demo profile)

| URL | Screen | Notes |
|-----|--------|-------|
| `/signin/smb` | **SMB sign-in** | All demo business owners |
| `/signin/smb?walkthrough=1` | **SMB walkthrough sign-in** | Maya Patel & Priya Rao only |
| `/signin/banker` | **RM sign-in** | All demo relationship managers |
| `/signin/banker?walkthrough=1` | **RM walkthrough sign-in** | Sarah Chen only |

Protected app routes redirect here when signed out, then return you to the original URL after login (`?next=/business/chat`).

### SMB owner (mobile shell)

| URL | Tab | What it does |
|-----|-----|--------------|
| `/business` | Home | Balances, cash signal, transactions, AI assistant card |
| `/business/chat` | Chat | AI assistant, intent badges, RM escalation card |
| `/business/forms` | Forms | Pre-filled business forms demo |
| `/business/activity` | Activity | Credit request status + RM notifications |
| `/business/profile` | Profile | Stats, AI business brief, integrations, guides |

### Banker / RM (desktop portal)

| URL | Nav | What it does |
|-----|-----|--------------|
| `/banker` | Dashboard | Portfolio metrics, priority queue, pipeline |
| `/banker/clients` | Clients | All SMBs sorted by stability |
| `/banker/clients/:id` | Client detail | Full SMB profile (transactions, credit, notes) |
| `/banker/credit` | Credit Review | AI brief, scorecard, approve / decline / refer |
| `/banker/profile` | My Profile | RM stats and session controls |

### In-app overlays (not separate URLs)

| Feature | Where | What it does |
|---------|-------|--------------|
| **Walkthrough** | Floating button (bottom-right, above Feedback) | Guided demo for Maya/Priya → Sarah Chen handoff |
| **User testing feedback** | Floating **Feedback** tab (bottom-right of screen, outside phone mockup) | Optional 1–5 rating + comment; saves to SQLite |
| **Sign out** | Top session strip on every app screen | Ends demo session and returns to `/` — required before switching SMB ↔ RM |

---

## Setup (local dev)

**Requirements:** Python **3.13** (not 3.14), Node.js 20+, Anthropic API key in `.env`

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY=sk-ant-...  (must include the variable name)

# 2. Backend (terminal 1 — from project root)
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
# Or without activating venv:
# .venv/bin/uvicorn backend.main:app --reload --port 8000

# 3. Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Demo data auto-seeds on first backend startup.

**Verify backend:** `curl http://localhost:8000/health` → `{"status":"ok"}`

**Common issues**

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: sqlalchemy` | Activate `.venv` or use `.venv/bin/uvicorn` — don't use system Python |
| `Address already in use` (port 8000) | `lsof -ti :8000 \| xargs kill -9` then restart backend |
| Chat fails / auth error | Check `.env` has `ANTHROPIC_API_KEY=...` on one line (not just the key alone) |
| Vite proxy errors | Backend must be running on port 8000 |

### Docker (production-like, single container)

```bash
docker build -t brilliant-banker .
docker run --rm -p 7860:7860 --env-file .env brilliant-banker
```

Open **http://localhost:7860** (frontend + API served together).

---

## User testing feedback

Testers navigate the app normally. Feedback is **not** a separate route — it is a floating **Feedback** button at the **bottom-right of the browser window** (outside the SMB phone frame), visible after sign-in on both SMB and RM screens.

1. Sign in as any demo user
2. Use the app (chat, credit review, etc.)
3. Click **Feedback** → optional 1–5 rating + comment → **Submit feedback**

Submissions are stored in SQLite table `user_feedback` with: role, respondent name, screen path, rating, comment, timestamp.

### View feedback results (local)

```bash
sqlite3 data/brilliantbanker.db "
  SELECT datetime(created_at), role, respondent_name, screen_path, rating, comment
  FROM user_feedback
  ORDER BY created_at DESC;
"
```

On Hugging Face Spaces, data lives inside the container filesystem (`data/brilliantbanker.db`) and resets on redeploy unless you attach persistent storage.

---

## API overview

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |
| `GET` | `/api/auth/users` | List demo SMB profiles |
| `GET` | `/api/auth/bankers` | List demo RM profiles |
| `POST` | `/api/auth/login` | SMB mock login |
| `POST` | `/api/auth/banker-login` | RM mock login |
| `POST` | `/api/chat` | AI chat (LangGraph + Claude) |
| `GET` | `/api/chat/history/:smb_id` | Chat history |
| `GET` | `/banker/stream` | SSE live RM activity feed |
| `GET` | `/banker/portfolio` | RM portfolio summary |
| `GET` | `/banker/leads` | Credit pipeline / priority queue |
| `POST` | `/banker/leads/:id/decide` | Approve / decline / refer |
| `GET` | `/smb/:id/profile` | SMB profile + AI brief |
| `GET` | `/smb/:id/transactions` | Transaction history |
| `POST` | `/api/feedback/submit` | Save user-testing feedback |

Interactive API docs (local): **http://localhost:8000/docs**

---

## Deploy to Hugging Face

Single Docker Space, zero database setup — set `ANTHROPIC_API_KEY` as a Space secret.

1. Create a Space at [huggingface.co/new-space](https://huggingface.co/new-space) → SDK: **Docker**
2. Push this repo (or sync `backend/`, `frontend/`, `Dockerfile`, `.dockerignore`)
3. In Space **Settings → Repository secrets**, add `ANTHROPIC_API_KEY`
4. The Space builds from `Dockerfile` and serves on port **7860**

**Cost:** Hugging Face free CPU tier + ~$0.02–0.05 per conversation in Anthropic API calls.

---

## Demo Walkthrough

### End-to-End Story

1. Open **http://localhost:5173/signin/smb?walkthrough=1** → sign in as **Maya Patel**
2. Open **Chat** → ask for a **$25K** credit line
3. AI runs pre-qual, escalates, creates a lead in the RM queue
4. **Sign out** (top session strip) → home → **/signin/banker?walkthrough=1** → sign in as **Sarah Chen**
5. Open **Credit Review** → read AI brief → approve / decline / refer
6. Sign back in as Maya → **Activity** tab shows the decision in real time

Tap the floating **Walkthrough** button for a step-by-step guide. Use **/links** for direct URLs to any screen.

### Switching roles

Only one demo user session is active at a time. **Sign out** before switching between Business Owner and RM, or you may see the wrong role or stale state. Sign out returns you to `/` (home).

---

## Project Structure

```
brilliant-banker/
├── Dockerfile                 # Hugging Face / Docker production build
├── .dockerignore
├── .env.example               # Template — copy to .env and add your API key
├── frontend/
│   ├── package.json
│   ├── vite.config.js         # Dev proxy → localhost:8000
│   ├── tailwind.config.js     # PNC brand colors (navy + orange)
│   └── src/
│       ├── App.jsx            # Routes, auth gates, walkthrough + feedback overlays
│       ├── api.js             # REST + SSE client
│       ├── components/
│       │   ├── Layout.jsx           # SMB phone shell
│       │   ├── BankerLayout.jsx     # RM sidebar + main layout
│       │   ├── FeedbackPanel.jsx    # Floating user-testing feedback tab
│       │   ├── SessionControls.jsx  # Sign-out strip + session banner
│       │   ├── DemoGuide.jsx        # Walkthrough overlay
│       │   └── RMStreamFeed.jsx     # Live banker event feed
│       └── pages/
│           ├── Login.jsx            # Home + sign-in views
│           ├── ScreenLinks.jsx      # All route URLs
│           ├── Dashboard.jsx, Chat.jsx, Activity.jsx, Profile.jsx, Forms.jsx
│           └── banker/              # RM dashboard, clients, credit, profile
└── backend/
    ├── main.py                # FastAPI app, lifespan, static file serving
    ├── requirements.txt
    ├── agent/
    │   ├── graph.py           # LangGraph 4-node pipeline
    │   ├── tools.py           # cash_flow, credit_prequal, faq, escalate
    │   └── prompts.py         # Claude prompts
    ├── services/
    │   ├── claude_service.py  # Anthropic Claude wrapper
    │   ├── notify_service.py  # Decision notification drafting
    │   └── stream_service.py  # In-memory pub/sub for SSE
    ├── db/
    │   ├── database.py        # SQLAlchemy models + SQLite (8 tables)
    │   ├── conversations.py   # Chat history
    │   └── phone_map.py       # In-memory session mapping
    ├── models/schemas.py      # Pydantic models + Settings (.env)
    ├── routers/
    │   ├── chat.py            # /api/chat + mock auth
    │   ├── banker.py          # Portfolio, leads, decisions, notes
    │   ├── smb.py             # SMB profile + transactions
    │   ├── stream.py          # GET /banker/stream (SSE)
    │   └── feedback.py        # POST /api/feedback/submit
    └── seed/seed_data.py      # 5 SMBs, 5 bankers, transactions, leads
```

---

## Design Decisions

- **PNC brand theme**: Navy (#002D5F) and orange (#E35205), mobile-first responsive layout
- **Dedicated sign-in URLs**: `/signin/smb` and `/signin/banker` separate from app routes so browser back and bookmarks work
- **Home always at `/`**: No auto-redirect when signed in — use **Sign out** to switch demo users
- **Append-only audit trail**: `lead_events` table records every banker action
- **All AI responses via Claude**: Chat replies, decision notifications, business briefs — no hardcoded strings
- **Auto-escalation**: Credit requests over $10K automatically create a banker lead
- **Multi-turn context**: Last 10 messages provide conversational continuity
- **Zero-config deployment**: SQLite + in-memory stores — no external databases needed for POC
- **Real-time RM stream**: In-memory asyncio broadcast powers SSE so bankers see live client activity
- **User-testing feedback**: Floating panel posts to `user_feedback` table; view locally via SQLite
