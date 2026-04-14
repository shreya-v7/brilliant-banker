from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import FileResponse

from prometheus_fastapi_instrumentator import Instrumentator

from backend.db.mongo_client import close_mongo
from backend.db.postgres import init_db
from backend.models.schemas import Settings
from backend.routers import banker, chat, smb, stream

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
_settings = Settings()


# ── Security: in-memory rate limiter ─────────────────────────────────────────

class _RateBucket:
    __slots__ = ("tokens", "last")

    def __init__(self):
        self.tokens: float = 0
        self.last: float = 0.0


_buckets: dict[str, _RateBucket] = defaultdict(_RateBucket)
_RATE_LIMIT = _settings.RATE_LIMIT_PER_MINUTE
_EXPENSIVE_PREFIXES = ("/api/chat",)


def _check_rate(client_ip: str) -> bool:
    """Token-bucket rate limiter. Returns True if request is allowed."""
    now = time.monotonic()
    bucket = _buckets[client_ip]
    elapsed = now - bucket.last
    bucket.last = now
    bucket.tokens = min(_RATE_LIMIT, bucket.tokens + elapsed * (_RATE_LIMIT / 60.0))
    if bucket.tokens >= 1:
        bucket.tokens -= 1
        return True
    return False


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(p) for p in _EXPENSIVE_PREFIXES):
            client_ip = request.client.host if request.client else "unknown"
            if not _check_rate(client_ip):
                from starlette.responses import JSONResponse
                return JSONResponse(
                    {"detail": "Rate limit exceeded. Please wait before sending another message."},
                    status_code=429,
                )
        return await call_next(request)


# ── Lifespan ─────────────────────────────────────────────────────────────────

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


async def _init_with_retry(max_retries: int = 5, delay: float = 3.0):
    """Retry database init — Railway databases may take a few seconds to accept connections."""
    for attempt in range(1, max_retries + 1):
        try:
            await init_db()
            logger.info("Database initialized (attempt %d)", attempt)
            return
        except Exception as e:
            if attempt == max_retries:
                raise
            logger.warning("DB connection attempt %d/%d failed: %s — retrying in %.0fs", attempt, max_retries, e, delay)
            await asyncio.sleep(delay)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — initializing database tables")
    await _init_with_retry()
    await _auto_seed_if_empty()
    yield
    await close_mongo()
    logger.info("Shut down complete")


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Brilliant Banker",
    description="AI banking assistant for small business owners",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if _settings.is_remote_db else "/docs",
    redoc_url=None if _settings.is_remote_db else "/redoc",
)

_origins = (
    [o.strip() for o in _settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    if _settings.ALLOWED_ORIGINS
    else ["*"]
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat.router)
app.include_router(banker.router)
app.include_router(smb.router)
app.include_router(stream.router)

Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    excluded_handlers=["/health", "/metrics"],
).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


# ── Serve built React frontend (production only) ────────────────────────────

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
