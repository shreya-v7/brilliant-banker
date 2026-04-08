"""
Server-Sent Events (SSE) endpoint for the RM dashboard.

The banker's frontend connects to GET /banker/stream and receives
real-time events as chat highlights, escalations, and decisions happen.
"""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.services.stream_service import subscribe_events

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/banker", tags=["stream"])


async def _event_generator():
    """Yield SSE-formatted events from the Redis pub/sub channel."""
    yield "event: connected\ndata: {\"status\":\"connected\"}\n\n"

    try:
        async for event in subscribe_events():
            event_type = event.get("event_type", "update")
            data = json.dumps(event, default=str)
            yield f"event: {event_type}\ndata: {data}\n\n"
    except asyncio.CancelledError:
        logger.info("SSE client disconnected")
        return


@router.get("/stream", summary="SSE stream of real-time RM events")
async def sse_stream():
    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
