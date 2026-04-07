# Brilliant Banker

AI-powered banking assistant for small business owners, styled as a PNC Bank mobile app. Features an integrated chatbot that handles cash flow analysis, credit pre-qualification, FAQs, and banker escalation.

## Architecture

```
React Mobile App → POST /api/chat → LangGraph Agent → Claude → JSON response
                                      │
                                      ├─ intent_classifier (Claude)
                                      ├─ tool_router → cash_flow / credit_prequal / faq / escalate
                                      ├─ reply_composer (Claude)
                                      └─ escalation_checker (auto-escalate >$10K)
```

**Frontend:** React + Vite + Tailwind CSS — mobile-first UI with PNC brand colors (navy + orange)

**Data stores:**
- **PostgreSQL** — SMB profiles, leads, lead decision events
- **Redis** — Phone-to-SMB session mapping
- **MongoDB** — Conversation history (multi-turn chat context)

## App Screens

| Screen | Description |
|--------|-------------|
| **Login** | PNC-styled login with 5 demo SMB business profiles to choose from |
| **Dashboard** | Account balances, cash flow health bar, quick actions, recent transactions, link to AI chat |
| **Chat** | Full chatbot UI with message bubbles, typing indicator, intent badges, suggested prompts |
| **Activity** | Banker leads view — filter/expand/approve/decline/refer escalated requests |
| **Profile** | Business details, financial stats, on-demand AI business brief from Claude |

## Setup

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env — set at minimum:
#   ANTHROPIC_API_KEY   — required for all Claude calls
# Twilio keys are optional (SMS fallback still works without them)
```

### 2. Start everything

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, MongoDB, the FastAPI backend (port 8000), and the React frontend (port 5173).

### 3. Seed mock data

```bash
docker compose exec api python -m backend.seed.seed_data
```

### 4. Open the app

Visit **http://localhost:5173** — select any demo user to start.

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
├── docker-compose.yml
├── Dockerfile                 # Backend (FastAPI)
├── .env.example
├── frontend/
│   ├── Dockerfile             # Frontend (Vite dev server)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js             # Backend API client
│       ├── index.css
│       ├── components/
│       │   ├── Layout.jsx     # App shell + header
│       │   └── BottomNav.jsx  # Tab navigation
│       └── pages/
│           ├── Login.jsx      # Demo user selector
│           ├── Dashboard.jsx  # Home screen
│           ├── Chat.jsx       # AI chatbot
│           ├── Activity.jsx   # Banker leads
│           └── Profile.jsx    # Business profile + AI brief
└── backend/
    ├── main.py                # FastAPI app + CORS + lifespan
    ├── agent/
    │   ├── graph.py           # LangGraph 4-node pipeline
    │   ├── tools.py           # cash_flow, credit_prequal, faq, escalate
    │   └── prompts.py         # All system/user prompts
    ├── services/
    │   ├── twilio_service.py  # SMS via Twilio (optional)
    │   ├── notify_service.py  # Decision SMS drafting
    │   └── claude_service.py  # Anthropic Claude wrapper
    ├── db/
    │   ├── postgres.py        # SQLAlchemy async models
    │   ├── redis_client.py    # Session mapping
    │   └── mongo_client.py    # Conversation CRUD
    ├── models/
    │   └── schemas.py         # Pydantic models + settings
    ├── routers/
    │   ├── chat.py            # POST /api/chat (main app endpoint)
    │   ├── sms.py             # POST /sms (Twilio webhook, optional)
    │   ├── banker.py          # Leads + decisions
    │   └── smb.py             # SMB profile + AI brief
    └── seed/
        └── seed_data.py       # Seed 5 mock SMBs
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

## Design Decisions

- **PNC brand theme**: Navy (#002D5F) and orange (#E35205) throughout, mobile-first responsive layout
- **Append-only decisions**: `lead_events` table stores each banker action; `leads` row is never updated
- **All AI responses via Claude**: Chat replies, decision SMS, business briefs — no hardcoded strings
- **Auto-escalation**: Credit requests over $10K automatically create a banker lead
- **Multi-turn context**: Last 10 messages from MongoDB provide conversational continuity
- **Async throughout**: asyncpg, motor, redis.asyncio
- **SMS still works**: The `/sms` Twilio webhook endpoint is still available as an alternate channel
