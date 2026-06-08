---
title: Brilliant Banker
emoji: 🏦
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Brilliant Banker

AI-powered banking POC: SMB owners get an in-app financial advisor; Relationship Managers get a CRM with AI briefs, warm leads, and one-tap credit decisions.

**Stack:** React/Vite frontend · FastAPI backend · LangGraph + Claude · SQLite · Docker on Hugging Face Spaces

---

## Architecture

```
Browser (React + Vite)
  Role picker │ SMB mobile shell │ Banker CRM │ Walkthrough │ Feedback
        │ REST + SSE (/api/*, /banker/stream)
        ▼
FastAPI (backend/main.py)
  chat.py │ banker.py │ smb.py │ feedback.py
        │
        ▼
LangGraph agent (graph.py)
  intent_classifier → tool_router → reply_composer → escalation
        │ Claude API
        ▼
SQLite (data/brilliantbanker.db)
  SMBs, bankers, transactions, leads, conversations, user_feedback, …
In-memory: RM event stream (SSE), session phone map
```

### POC vs production

| Component | Production | This POC |
|-----------|-----------|----------|
| Database | PostgreSQL | SQLite (auto-created + seeded) |
| Cache / events | Redis / Kafka | In-memory |
| ML | XGBoost, Prophet, etc. | Rule-based scoring |
| Auth | Biometric + OAuth | Mock login (pick a demo user) |
| Deploy | Kubernetes | Hugging Face Space (Docker, port 7860) |

### AI chat pipeline

```
POST /api/chat → LangGraph → cash_flow | credit_prequal | faq | escalate
  → reply_composer (Claude)
  → auto-escalate credit requests > $10K → SSE to banker stream
```

---

## App screens

### Public

| URL | Screen |
|-----|--------|
| `/` | Home — role picker (no auto-redirect when signed in) |
| `/links` | All screen URLs (copyable deep links) |
| `/scene` | Customer discovery skit |
| `/marketing` | Marketing page |

### Sign-in

| URL | Notes |
|-----|-------|
| `/signin/smb` | All demo business owners |
| `/signin/smb?walkthrough=1` | Maya Patel & Priya Rao only |
| `/signin/banker` | All demo RMs |
| `/signin/banker?walkthrough=1` | Sarah Chen only |

Protected routes redirect to sign-in, then return via `?next=/business/chat`.

### SMB (mobile shell)

| URL | Tab |
|-----|-----|
| `/business` | Home — balances, cash signal, transactions |
| `/business/chat` | AI assistant + RM escalation |
| `/business/forms` | Pre-filled business forms |
| `/business/activity` | Credit status + RM notifications |
| `/business/profile` | Stats, AI brief, integrations |

### Banker / RM

| URL | Nav |
|-----|-----|
| `/banker` | Dashboard — portfolio, priority queue |
| `/banker/clients` | All SMBs |
| `/banker/clients/:id` | Client detail |
| `/banker/credit` | Credit review — approve / decline / refer |
| `/banker/profile` | RM profile + session controls |

### Overlays (not separate URLs)

| Feature | Where |
|---------|-------|
| **Walkthrough** | Floating button (bottom-right, above Feedback) |
| **Feedback** | Floating tab — bottom-right of browser, outside phone mockup |
| **Sign out** | Top session strip — required before switching SMB ↔ RM |

---

## Setup (local)

**Requirements:** Python **3.13** (not 3.14), Node.js 20+, Anthropic API key in `.env`

```bash
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY=sk-ant-...  (must include the variable name)

# Terminal 1 — backend (from project root)
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173**. Demo data seeds on first backend startup.

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: sqlalchemy` | Use `.venv/bin/uvicorn` or activate venv |
| Port 8000 in use | `lsof -ti :8000 \| xargs kill -9` |
| Chat auth error | `.env` must be `ANTHROPIC_API_KEY=...` (not just the key) |
| Vite proxy errors | Backend must run on port 8000 |

### Docker

```bash
docker build -t brilliant-banker .
docker run --rm -p 7860:7860 --env-file .env brilliant-banker
```

Open **http://localhost:7860**.

---

## User testing feedback

After sign-in, click the floating **Feedback** tab (bottom-right of the browser window). Optional 1–5 rating + comment → saved to SQLite `user_feedback`.

```bash
sqlite3 data/brilliantbanker.db "
  SELECT datetime(created_at), role, respondent_name, screen_path, rating, comment
  FROM user_feedback ORDER BY created_at DESC;
"
```

On Hugging Face Spaces, DB resets on redeploy unless you attach persistent storage.

---

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/login` | SMB mock login |
| `POST` | `/api/auth/banker-login` | RM mock login |
| `POST` | `/api/chat` | AI chat |
| `GET` | `/banker/stream` | SSE live RM feed |
| `GET` | `/banker/leads` | Credit pipeline |
| `POST` | `/banker/leads/:id/decide` | Approve / decline / refer |
| `POST` | `/api/feedback/submit` | Save feedback |

Full list: **http://localhost:8000/docs**

---

## Deploy (Hugging Face)

1. Create a Space → SDK: **Docker**
2. Push repo (`backend/`, `frontend/`, `Dockerfile`)
3. Add `ANTHROPIC_API_KEY` in Space **Settings → Repository secrets**
4. Serves on port **7860**

---

## Demo walkthrough

1. **/signin/smb?walkthrough=1** → sign in as **Maya Patel**
2. **Chat** → ask for a **$25K** credit line → AI escalates to RM queue
3. **Sign out** → **/signin/banker?walkthrough=1** → **Sarah Chen** → **Credit Review** → decide
4. Sign back in as Maya → **Activity** shows the decision

Use **/links** for direct URLs. Only one demo session at a time — sign out before switching roles.

---

## Project structure

```
brilliant-banker/
├── Dockerfile, .env.example
├── frontend/src/          # React app (App.jsx routes, FeedbackPanel, SessionControls)
└── backend/
    ├── main.py            # FastAPI + static serve
    ├── agent/             # LangGraph pipeline
    ├── routers/           # chat, banker, smb, stream, feedback
    ├── db/database.py     # SQLite models
    └── seed/seed_data.py  # 5 SMBs, 5 bankers
```
