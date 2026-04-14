"""
Prometheus metrics for Brilliant Banker.

Three categories:
  1. API health — auto-instrumented by prometheus-fastapi-instrumentator
  2. Claude/AI — call counts, latency, tokens, cost, errors
  3. Business  — chat volume, credit decisions, escalations, sessions
"""

from __future__ import annotations

from prometheus_client import Counter, Histogram, Gauge

# ── Claude / AI metrics ──────────────────────────────────────────────────────

CLAUDE_CALLS = Counter(
    "claude_calls_total",
    "Total Claude API calls",
    ["function"],
)

CLAUDE_LATENCY = Histogram(
    "claude_latency_seconds",
    "Claude API call latency",
    ["function"],
    buckets=(0.5, 1, 2, 3, 5, 8, 10, 15, 30),
)

CLAUDE_INPUT_TOKENS = Counter(
    "claude_input_tokens_total",
    "Total input tokens sent to Claude",
    ["function"],
)

CLAUDE_OUTPUT_TOKENS = Counter(
    "claude_output_tokens_total",
    "Total output tokens received from Claude",
    ["function"],
)

CLAUDE_ERRORS = Counter(
    "claude_errors_total",
    "Claude API errors",
    ["function", "error_type"],
)

CLAUDE_COST = Counter(
    "claude_estimated_cost_dollars",
    "Estimated Claude API cost in USD",
)

# Sonnet 4 pricing: $3/MTok input, $15/MTok output
COST_PER_INPUT_TOKEN = 3.0 / 1_000_000
COST_PER_OUTPUT_TOKEN = 15.0 / 1_000_000

# ── Business metrics ─────────────────────────────────────────────────────────

CHAT_MESSAGES = Counter(
    "chat_messages_total",
    "Total chat messages processed",
    ["intent"],
)

CREDIT_DECISIONS = Counter(
    "credit_decisions_total",
    "Total credit decisions made by bankers",
    ["action"],
)

ESCALATIONS = Counter(
    "escalations_total",
    "Total escalations triggered",
)

ACTIVE_SMB_SESSIONS = Gauge(
    "active_smb_sessions",
    "Currently active SMB chat sessions (approximate)",
)
