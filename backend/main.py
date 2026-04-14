from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.mongo_client import close_mongo
from backend.db.postgres import init_db
from backend.routers import banker, chat, smb, stream

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def _auto_seed_if_empty():
    """Seed demo data on first startup so hosted deploys work without manual steps."""
    from sqlalchemy import select, func
    from backend.db.postgres import SMB, async_session

    try:
        async with async_session() as session:
            count = await session.scalar(select(func.count()).select_from(SMB))
            if count and count > 0:
                logger.info("Database already seeded (%d SMBs)", count)
                return

        logger.info("Empty database detected — auto-seeding demo data...")
        from backend.seed.seed_data import seed
        await seed()
        logger.info("Auto-seed complete")
    except Exception as e:
        logger.warning("Auto-seed skipped: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — initializing database tables")
    await init_db()
    await _auto_seed_if_empty()
    yield
    await close_mongo()
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


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
