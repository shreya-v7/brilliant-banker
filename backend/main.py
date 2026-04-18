from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from backend.db.conversations import clear_all_conversations
from backend.db.database import init_db
from backend.db.lead_utils import normalize_demo_leads
from backend.models.schemas import Settings
from backend.routers import banker, chat, smb, stream, survey

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
_settings = Settings()


async def _auto_seed_if_empty():
    from sqlalchemy import select, func
    from backend.db.database import SMB, async_session

    try:
        async with async_session() as session:
            count = await session.scalar(select(func.count()).select_from(SMB))
            if count and count > 0:
                logger.info("Database already seeded (%d SMBs)", count)
                return

        logger.info("Empty database  - auto-seeding demo data...")
        from backend.seed.seed_data import seed
        await seed()
        logger.info("Auto-seed complete")
    except Exception as e:
        logger.warning("Auto-seed skipped: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path("data").mkdir(exist_ok=True)
    logger.info("Starting up  - initializing database")
    await init_db()
    try:
        await clear_all_conversations()
        logger.info("Cleared chat history (fresh run)")
    except Exception as e:
        logger.warning("Could not clear conversations: %s", e)
    try:
        await normalize_demo_leads()
    except Exception as e:
        logger.warning("Could not collapse duplicate leads: %s", e)
    await _auto_seed_if_empty()
    yield
    logger.info("Shut down complete")


app = FastAPI(
    title="Brilliant Banker",
    description="AI banking assistant for small business owners",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(banker.router)
app.include_router(smb.router)
app.include_router(stream.router)
app.include_router(survey.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


# ── Serve built React frontend in production ─────────────────────────────────

_FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend_dist"

if _FRONTEND_DIR.is_dir():
    logger.info("Serving frontend from %s", _FRONTEND_DIR)
    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def serve_spa(path: str):
        file = _FRONTEND_DIR / path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(_FRONTEND_DIR / "index.html")
