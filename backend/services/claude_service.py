from __future__ import annotations

import anthropic

from backend.models.schemas import Settings

settings = Settings()

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


async def call_claude(
    system: str,
    user_message: str,
    max_tokens: int = 300,
    temperature: float = 0.3,
) -> str:
    client = get_client()
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text


async def classify_intent(message: str, history: list[dict]) -> str:
    from backend.agent.prompts import INTENT_CLASSIFIER_PROMPT

    history_text = ""
    if history:
        history_text = "\n".join(
            f"{m['role']}: {m['content']}" for m in history[-5:]
        )

    user_prompt = f"Conversation history:\n{history_text}\n\nCurrent message: {message}"
    return await call_claude(
        system=INTENT_CLASSIFIER_PROMPT,
        user_message=user_prompt,
        max_tokens=50,
        temperature=0.0,
    )


async def compose_reply(message: str, tool_result: dict, history: list[dict]) -> str:
    from backend.agent.prompts import REPLY_COMPOSER_PROMPT
    import json

    history_text = ""
    if history:
        history_text = "Recent conversation:\n" + "\n".join(
            f"{m['role']}: {m['content']}" for m in history[-5:]
        )

    prompt = REPLY_COMPOSER_PROMPT.format(
        message=message,
        tool_result=json.dumps(tool_result, indent=2),
    )
    if history_text:
        prompt = history_text + "\n\n" + prompt

    return await call_claude(
        system="You are Brilliant Banker. Reply in 1-2 plain sentences. No emoji. No jargon. Always say 'your Relationship Manager' or 'your RM' — never 'a banker'.",
        user_message=prompt,
        max_tokens=200,
    )


async def generate_ai_brief(profile: dict) -> str:
    from backend.agent.prompts import AI_BRIEF_PROMPT

    prompt = AI_BRIEF_PROMPT.format(**profile)
    return await call_claude(
        system="You are a credit analyst. Be concise and data-driven.",
        user_message=prompt,
        max_tokens=300,
    )


async def generate_rm_highlight(
    smb_name: str,
    intent: str,
    message: str,
    tool_result: dict,
    escalated: bool,
) -> str:
    import json
    from backend.agent.prompts import RM_HIGHLIGHT_PROMPT

    tool_summary = json.dumps(tool_result, default=str)[:300]
    prompt = RM_HIGHLIGHT_PROMPT.format(
        smb_name=smb_name,
        intent=intent,
        message=message,
        tool_summary=tool_summary,
        escalated="Yes" if escalated else "No",
    )
    return await call_claude(
        system="Write a single-sentence RM notification. No emoji. Be factual.",
        user_message=prompt,
        max_tokens=80,
        temperature=0.2,
    )
