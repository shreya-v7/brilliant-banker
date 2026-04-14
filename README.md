# Brilliant Banker

AI-powered banking assistant that serves **two users simultaneously**: SMB owners get an always-on financial advisor inside the PNC mobile app, and Relationship Managers get a CRM dashboard with AI-generated pre-call briefs, warm leads ranked by urgency, and one-tap credit decisions. Every interaction between an SMB and their bank makes the AI smarter about that business, the banker more prepared for the next call, and the SMB more confident about their finances.

---

## The Problem: Human Coverage Cannot Scale

PNC has **928K SMB client relationships** across 2,200 branches served by **596 bankers**. The math produces ~354 SMBs per branch manager — and only **35% get contacted in 2 years**. Hiring 1,000 more bankers still leaves 790K+ unserved. Three consequences emerge without intervention:

- **$66K fraud undetected** — Carroll case, 4 months before discovery
- **Credit denied blindly** — Fox (800+ score) waited 4 weeks with no proactive outreach
- **Deposits leaving to Square** — Valentina, active customer, moving money to a competitor

**AI is the only solution that scales insight to 796K clients simultaneously while alerting humans when action is needed.** Brilliant Banker is the in-app AI advisor + banker CRM that makes this possible — embedded in the PNC mobile app, human-in-the-loop for all transactions.

---

## System Architecture (5 Layers)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: Data Sources (PNC existing infrastructure)                    │
│  Transactions | Accounts | Call transcripts | Industry codes            │
│  Event hub | Agentic platform                                           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 2: Intelligence Engine (what we build)                           │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Seasonal ML  │ │ Cash flow    │ │ Credit       │ │ Anomaly      │   │
│  │ STL/Prophet  │ │ XGBoost/LSTM │ │ pre-qual     │ │ detection    │   │
│  │              │ │              │ │ LogReg/GBM   │ │ Isol. forest │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                         │
│  Peer benchmark (928K) | External signals (NOAA) | Feature store (Feast)│
│  LLM message composer (Anthropic/OpenAI + PNC guardrails + compliance)  │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Decision + Routing Engine                                     │
│  Priority ranking | Channel routing | Alert timing | Dual-side bridge   │
└────────┬─────────────────────┬─────────────────────┬───────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌────────────────┐   ┌──────────────┐   ┌────────────────────┐
│ SMB: PNC App   │   │   Bridge     │   │ Banker: CRM        │
│ Cash forecast  │   │ Alerts both  │   │ Pre-call brief     │
│ Credit pre-qual│   │ sides at     │   │ Warm leads         │
│ Product recs   │   │ once. Cold   │   │ Risk flags         │
│ AI chat        │   │ to warm.     │   │ Multi-entity       │
└───────┬────────┘   └──────────────┘   └───────┬────────────┘
        │                                       │
        ▼                                       ▼
  SMB owner's phone                       Banker's laptop
                    ┌─────────────────┐
                    │ Layer 4: Auth   │
                    │ Biometric | PII │
                    │ Audit | TCPA    │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Layer 5: Flywheel            │
              │ Every interaction enriches   │
              │ data layer. Response rates,  │
              │ adoptions, call outcomes,    │  ──── loops back to Layer 1
              │ seasonal corrections feed    │
              │ back to improve all models.  │
              └──────────────────────────────┘

Legend: Gray = PNC existing | Purple = ML we build | Coral = routing
        Blue = delivery | Green = flywheel
```

---

## Implementation Roadmap (18 months, 4 phases)

### Phase 1: Data Foundation (months 1–3) — Borrow from PNC

| Component | Details | Tech |
|-----------|---------|------|
| Transaction pipeline | Wire event hub into feature store. Rolling aggregates (7d, 30d, 90d, YoY) per client. | Kafka, batch+stream |
| Seasonal decomposition | Decompose 3+ year histories into trend, seasonal, residual. Seasonality index per client. | Prophet/STL, 928K clients |
| Feature store | Centralized registry: seasonality index, cash runway, peer percentile, product gaps per client. | Feast/Tecton, Redis cache |

### Phase 2: Cash Flow MVP (months 3–6) — First client-facing value

| Component | Details | Tech |
|-----------|---------|------|
| 90-day forecaster | Forward projection with confidence bands. Best/middle/worst scenarios. | XGBoost, daily retrain |
| In-app AI chat | Embedded in PNC mobile app. Conversational interface for forecasts, Q&A, product info. | LLM API, PNC SDK |
| Banker CRM v1 | Pre-call brief for pilot bankers. Client health, seasonal flags, conversation prompts. | React, REST API |
| Pilot: 1,000 SMBs | Seasonal businesses first. Target: 20% MAPE, 3+ bankers daily. Shadow mode 90 days first. | Fox, Valentina, Kayla |

### Phase 3: Full Intelligence (months 6–12) — Requires compliance approval

| Component | Details | Tech |
|-----------|---------|------|
| Credit pre-qual | Transaction-based scoring. Approval probability + amount range. Explainable model for ECOA. | Logistic reg, OCC review |
| Product discovery | Contextual recommendations triggered by account activity. Surfaces PNC's 18%-awareness products. | Rec engine, A/B test |
| Anomaly detection | Real-time fraud and unusual vendor alerts. Prevents Carroll $66K scenario. Sub-minute latency. | Isolation forest, Flink |
| Bridge alerts | Dual notification: owner (in-app push) + banker (CRM update) simultaneously on actionable events. | Event router, Push API |

### Phase 4: Scale to ~796K (months 12–18) — Flywheel compounds

| Component | Details |
|-----------|---------|
| Full portfolio rollout | From 1K pilot to 796K. Regional: Midwest first (273K, 156 bankers), then NE, SE, SW. |
| Feedback loop tuning | Send-time optimization. Seasonal correction after first full cycle. Playbook quality scoring. |
| Success metrics | NPS lift from 4. Product penetration 81%→85%. Lending 9%→15%+. Contact rate 35%→65%+. |

### Investment & Risk Summary

| Category | Requirement | Mitigation |
|----------|-------------|------------|
| Team | 7–10 hires: 3-5 ML, 1-2 conversational AI, 1-2 streaming, 1 UX | Small vs Chase $18B. Focused team. |
| Infra | Feature store, streaming layer, LLM API, PNC app SDK | PNC has 5/6 building blocks. Incremental. |
| Accuracy | Forecast must be under 20% MAPE before going live | BofA CashPro proves approach. 90-day shadow mode. |
| Regulatory | Credit pre-qual framing under ECOA / OCC AI guidance | Explainable models. "Informational" framing. |
| Addressable | ~796K × $6,765 = ~$5.4B within PNC existing base | 5% adoption lift = ~$269M. Aligns with 2030 targets. |

> Key change from prior version: chat interface is now embedded in PNC mobile app, not SMS. Transactions confirmed via biometric within the same app session. Push notifications replace SMS for proactive alerts.

---

## Prototype Architecture (what this repo implements)

```
React Mobile App → POST /api/chat → LangGraph Agent → Claude → JSON response
                                      │
                                      ├─ intent_classifier (Claude)
                                      ├─ tool_router → cash_flow / credit_prequal / faq / escalate
                                      ├─ reply_composer (Claude)
                                      └─ escalation_checker (auto-escalate >$10K)
```

**Frontend:** React 18 + Vite 6 + Tailwind CSS 3 — mobile-first UI with PNC brand colors (navy #002D5F + orange #E35205)

**Data stores:**
- **PostgreSQL 16** — SMB profiles, leads, lead decision events, transactions, bankers, notes
- **Redis 7** — Phone-to-SMB session mapping + pub/sub for real-time RM event stream
- **MongoDB 7** — Conversation history (multi-turn chat context)

## App Screens

### SMB Owner (mobile app)

| Screen | Description |
|--------|-------------|
| **Login** | Role picker (Business Owner vs PNC Banker), then profile selector |
| **Dashboard** | Checking/savings balances, 30-day cash flow summary, quick actions, recent transactions, AI assistant card |
| **Chat** | Full chatbot with message bubbles, typing indicator, intent badges, suggested prompts, RM contact card on escalation |
| **Activity** | Track all credit requests — filter by status, expand for details, see RM notifications |
| **Profile** | Business details, financial stats, on-demand AI business brief, logout |

### Banker / RM (desktop portal)

| Screen | Description |
|--------|-------------|
| **Dashboard** | Key metrics, portfolio overview, credit pipeline bar, priority queue, portfolio health donut, at-risk clients, payment history, quick actions |
| **My Clients** | All SMBs sorted by stability, tap to drill into full profile |
| **Credit Review** | Pending leads with AI pre-call brief, conversation playbook, approve/decline/refer with Claude-drafted notifications |
| **Client Profile** | 4-tab view: Overview (stats + AI brief), Transactions (30-day summary + list), Credit History, Banker Notes |
| **Profile** | Banker info + logout |

## Setup (local)

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env — set at minimum:
#   ANTHROPIC_API_KEY   — required for all Claude calls
```

### 2. Start everything

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, MongoDB, the FastAPI backend (port 8000), and the React frontend (port 5173). **Demo data is auto-seeded on first startup** — no manual seed step needed.

### 3. Open the app

Visit **http://localhost:5173** — select any demo user to start.

> Manual re-seed (if needed): `docker compose exec api python -m backend.seed.seed_data`

## Demo Users

| Name               | Business       | Revenue | Cash Stability | UUID |
|--------------------|----------------|---------|----------------|------|
| Anne Fox           | Floral design  | $1.2M   | 72%            | `11111111-1111-1111-1111-111111111111` |
| Justin Strong      | Dry cleaning   | $532K   | 61%            | `22222222-2222-2222-2222-222222222222` |
| Melissa Murphy     | Restaurant     | $680K   | 45%            | `33333333-3333-3333-3333-333333333333` |
| Valentina Cruz     | Bike tourism   | $490K   | 38%            | `44444444-4444-4444-4444-444444444444` |
| Richard Watterson  | Bookkeeping    | $85K    | 91%            | `55555555-5555-5555-5555-555555555555` |

## API Endpoints

### Chat (used by frontend)

```bash
# Send a message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"smb_id": "11111111-1111-1111-1111-111111111111", "message": "What does my cash flow look like?"}'

# Get chat history
curl http://localhost:8000/api/chat/11111111-1111-1111-1111-111111111111/history

# List demo users
curl http://localhost:8000/api/auth/users
```

### Banker API

```bash
# List leads
curl http://localhost:8000/banker/leads
curl "http://localhost:8000/banker/leads?status=pending"

# Approve a lead
curl -X POST http://localhost:8000/banker/leads/<lead-id>/decision \
  -H "Content-Type: application/json" \
  -d '{"action": "approved", "amount": 50000, "banker_note": "Strong profile"}'
```

### SMB Profile (with AI brief)

```bash
curl http://localhost:8000/smb/11111111-1111-1111-1111-111111111111/profile
```

## Example Chat Conversations

### Cash flow query
> **You:** What's my cash flow forecast?
> **Bot:** Based on your average monthly revenue of $98,000 and cash stability of 0.72, your projected 30-day net is $24,640 with low risk.

### Credit pre-qualification
> **You:** Can I get a $25K credit line?
> **Bot:** Based on your profile, you pre-qualify for up to $79,380 with a 0.73 approval probability. A banker will follow up since this is over $10K.

### FAQ
> **You:** What are your branch hours?
> **Bot:** Our branches are open Monday-Friday 9AM-5PM and Saturday 9AM-1PM. You can also bank 24/7 through our app.

### Escalation
> **You:** I need to talk to someone about my account
> **Bot:** I've connected you with a banker who will reach out shortly.

## Project Structure

```
brilliant-banker/
├── docker-compose.yml          # 5 services: Postgres, Redis, Mongo, API, Frontend
├── Dockerfile                  # Backend (Python 3.12 + FastAPI)
├── .env.example                # Required: ANTHROPIC_API_KEY
├── ARCHITECTURE.md             # Full technical deep-dive + HuggingFace dataset roadmap
├── docs/
│   ├── system-architecture.png
│   └── implementation-detail.png
├── frontend/
│   ├── Dockerfile              # Vite dev server
│   ├── package.json
│   ├── vite.config.js          # Proxy /api, /banker, /smb → backend:8000
│   ├── tailwind.config.js      # PNC brand colors
│   ├── index.html
│   ├── public/
│   │   ├── pnc-icon.svg
│   │   └── rm-dashboard.html   # Standalone full-screen RM dashboard
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # Role-based routing (SMB vs Banker)
│       ├── api.js              # All fetch calls + SSE stream
│       ├── index.css
│       ├── components/
│       │   ├── Layout.jsx          # SMB app shell + header
│       │   ├── BottomNav.jsx       # SMB tab navigation
│       │   ├── BankerLayout.jsx    # Banker app shell
│       │   ├── BankerBottomNav.jsx # Banker tab navigation
│       │   ├── DemoGuide.jsx       # Step-by-step walkthrough overlay
│       │   └── RMStreamFeed.jsx    # Real-time SSE activity feed
│       └── pages/
│           ├── Login.jsx           # Role picker + profile selector
│           ├── Marketing.jsx       # Product marketing page
│           ├── Dashboard.jsx       # SMB home: balances, cash flow, transactions
│           ├── Chat.jsx            # AI chatbot with intent badges
│           ├── Activity.jsx        # SMB credit request tracker
│           ├── Profile.jsx         # SMB business profile + AI brief
│           └── banker/
│               ├── BankerDashboard.jsx   # Portfolio metrics, pipeline, priority queue
│               ├── BankerClients.jsx     # Client list sorted by risk
│               ├── BankerCreditReview.jsx # AI brief + playbook + decisions
│               ├── BankerSMBProfile.jsx  # 4-tab client deep-dive
│               └── BankerProfile.jsx     # Banker info + logout
└── backend/
    ├── main.py                 # FastAPI app + CORS + lifespan
    ├── requirements.txt
    ├── agent/
    │   ├── graph.py            # LangGraph 4-node pipeline (compiled StateGraph)
    │   ├── tools.py            # cash_flow, credit_prequal, faq, escalate
    │   └── prompts.py          # All system/user/RM prompts
    ├── services/
    │   ├── claude_service.py   # Anthropic Claude wrapper (Sonnet 4.6)
    │   ├── notify_service.py   # Claude-drafted decision notifications
    │   └── stream_service.py   # Redis pub/sub for real-time RM event stream
    ├── db/
    │   ├── postgres.py         # SQLAlchemy async models (6 tables)
    │   ├── redis_client.py     # Session mapping + pub/sub
    │   └── mongo_client.py     # Conversation history CRUD
    ├── models/
    │   └── schemas.py          # Pydantic models + settings
    ├── routers/
    │   ├── chat.py             # POST /api/chat + auth endpoints
    │   ├── banker.py           # Portfolio, leads, decisions, notes
    │   ├── smb.py              # SMB profile + transactions + escalations
    │   └── stream.py           # GET /banker/stream (SSE endpoint)
    └── seed/
        └── seed_data.py        # 5 SMBs, 3 bankers, transactions, leads, notes
```

## Demo Walkthrough

### 1. Log in as a Banker

On the login screen, tap the **PNC Banker** tab (not Business Owner). Select one of the demo bankers:

| Name | Title |
|------|-------|
| Sarah Chen | Senior Business Banking Advisor |
| Marcus Williams | SMB Relationship Manager |
| Jordan Patel | Business Credit Specialist |

---

### 2. Banker Dashboard (mobile app)

You land on the Banker Dashboard inside the mobile shell. This shows:
- **Hero strip** — client count, pending decisions, at-risk count
- **Portfolio Overview** — 4 metric cards (revenue, monthly avg, credit requested, approved)
- **Credit Pipeline** — status bar + recent decisions
- **Priority Queue** — pending leads ranked by urgency
- **Portfolio Health** — donut chart + per-client stability bars
- **Top Clients by Revenue**, **Needs Attention**, **Payment History**, **Quick Actions**

---

### 3. RM Command Center (full-screen dashboard)

Open a new tab and go to:

```
http://localhost:5173/rm-dashboard.html
```

Key things to point out:
- **SMB Revenue Timeline** — hover over any point to see each client's daily revenue. Five colored lines, one per SMB.
- **Client Portfolio table** — sorted by risk (lowest stability first). Red stability bars signal who needs a call.
- **Credit Pipeline** — full funnel from pending → approved/referred/declined with amounts.
- **Activity Feed** — surfaces pending decisions, completed decisions, and at-risk alerts in one place.

---

### 4. Review a Credit Request

Back in the mobile app, tap **Credit Review** (bottom nav or Quick Actions). Expand a pending lead:

1. Read the **AI Pre-call Brief** — a 30-second summary of the client's financial health
2. Review the **Conversation Playbook** — talking points for the call
3. Set an **approved amount** (pre-filled from the request)
4. Tap **Approve**, **Decline**, or **Refer**

The decision updates immediately and Claude drafts a plain-language notification for the SMB.

---

### 5. Explore a Client Profile

Tap **My Clients** → select any client (e.g. Melissa Murphy). The 4-tab profile shows:

| Tab | Content |
|-----|---------|
| **Overview** | Stats grid, AI brief (tap Generate), cash stability ring |
| **Transactions** | 30-day summary (income/expense/net) + full transaction list |
| **Credit History** | All past loan requests with status |
| **Notes** | Pre-seeded banker notes + add your own |

---

### 6. Guided Demo Mode

Tap the floating **Demo** button (bottom-right of any screen) to open the step-by-step guide. It walks through the full end-to-end story with navigation shortcuts and prompt chips that auto-inject messages into the SMB chat.

---

### Full End-to-End Story

1. **SMB side** — Melissa Murphy (restaurant owner) opens chat and asks for a $35K credit line
2. **AI escalates** — LangGraph detects the amount > $10K, runs pre-qual, creates a lead with urgency 0.85
3. **RM gets notified** — Melissa appears at #1 in the Priority Queue with a "High" urgency badge
4. **RM reviews** — Opens credit review, generates the AI brief, reviews the conversation playbook
5. **RM decides** — Approves with an amount; Claude drafts the approval notification
6. **SMB sees result** — Melissa's Activity tab shows "approved" with the notification text

---

## Hosting for UserTesting

UserTesting.com requires a publicly accessible `https://` URL — testers cannot run Docker locally. Here are the recommended hosting paths, cheapest first.

### Option A: Railway (recommended — easiest)

Railway natively supports multi-service Docker Compose deployments.

**Steps:**

1. Create a [Railway](https://railway.app) account (free tier includes $5/month credit)
2. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   ```
3. Create a new project and provision managed databases:
   ```bash
   railway init
   railway add --plugin postgresql
   railway add --plugin redis
   railway add --plugin mongodb
   ```
4. Set environment variables in the Railway dashboard:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   DATABASE_URL=<auto-provided by Railway Postgres plugin>
   REDIS_URL=<auto-provided by Railway Redis plugin>
   MONGODB_URL=<auto-provided by Railway MongoDB plugin>
   MONGODB_DB=brilliantbanker
   ```
5. Deploy backend and frontend as two services:
   - **Backend**: root directory, uses `./Dockerfile`, set port to 8000
   - **Frontend**: `./frontend` directory, uses `./frontend/Dockerfile`, set port to 5173
6. Update the frontend's Vite proxy to point to the backend's Railway internal URL (Railway provides `<service>.railway.internal` hostnames between services). Alternatively, configure Railway's networking to route `/api`, `/banker`, `/smb` paths to the backend service.
7. Railway provides a public `*.up.railway.app` HTTPS URL automatically.

**Cost:** ~$5-15/month depending on usage.

### Option B: DigitalOcean Droplet (most control)

Best if you want a single VM running the full Docker Compose stack.

**Steps:**

1. Create a DigitalOcean Droplet (Ubuntu 24.04, $12/month for 2GB RAM)
2. SSH in and install Docker:
   ```bash
   ssh root@<droplet-ip>
   apt update && apt install -y docker.io docker-compose-v2
   ```
3. Clone the repo and configure:
   ```bash
   git clone <your-repo-url> brilliant-banker
   cd brilliant-banker
   cp .env.example .env
   nano .env  # set ANTHROPIC_API_KEY
   ```
4. Start the stack:
   ```bash
   docker compose up -d --build
   ```
5. The app auto-seeds on first boot. Access at `http://<droplet-ip>:5173`.
6. For HTTPS (required by UserTesting), add Caddy as a reverse proxy:
   ```bash
   apt install -y caddy
   ```
   Create `/etc/caddy/Caddyfile`:
   ```
   yourdomain.com {
       reverse_proxy localhost:5173
   }
   ```
   ```bash
   systemctl restart caddy
   ```
   Caddy auto-provisions a Let's Encrypt TLS certificate.

**Cost:** $12/month. Use a cheap domain ($2/year from Namecheap) or a free `*.duckdns.org` subdomain.

### Option C: Render

Render requires each service to be deployed separately (no Docker Compose).

1. Create a [Render](https://render.com) account
2. Add managed databases: PostgreSQL (free tier), Redis ($7/month)
3. Use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier (512MB, more than enough for demo)
4. Deploy backend as a **Web Service** (Docker, root directory)
5. Deploy frontend as a **Static Site** or **Web Service** (Docker, `./frontend` directory)
6. Set all env vars in Render's dashboard
7. Render provides `*.onrender.com` HTTPS URLs

**Cost:** ~$7-14/month.

### UserTesting-Specific Notes

- **Testers need a live URL** — UserTesting.com opens your URL in the tester's browser. There is no way to run locally.
- **HTTPS is required** — all three hosting options above provide it.
- **First load may be slow on free tiers** — Railway and Render free tiers spin down after inactivity. The first request takes ~15s to cold-start. Upgrade to a paid plan or keep the service warm with a cron ping to `/health`.
- **API key cost** — each tester conversation costs ~$0.02-0.05 in Anthropic API calls. Budget ~$5-10 for a 50-tester study.
- **Demo guidance** — the login screen includes a prompt telling testers to start with "Business Owner" first. The floating Demo button on every screen opens a step-by-step walkthrough.

---

## Design Decisions

- **PNC brand theme**: Navy (#002D5F) and orange (#E35205) throughout, mobile-first responsive layout
- **Append-only decisions**: `lead_events` table stores each banker action; `leads` row is never updated
- **All AI responses via Claude**: Chat replies, decision notifications, business briefs — no hardcoded strings
- **Auto-escalation**: Credit requests over $10K automatically create a banker lead
- **Multi-turn context**: Last 10 messages from MongoDB provide conversational continuity
- **Async throughout**: asyncpg, motor, redis.asyncio
- **Real-time RM stream**: Redis pub/sub powers SSE events so bankers see live client activity as it happens
