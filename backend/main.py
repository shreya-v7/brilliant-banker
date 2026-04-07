from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.mongo_client import close_mongo
from backend.db.postgres import init_db
from backend.routers import banker, chat, smb

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — initializing database tables")
    await init_db()
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


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
