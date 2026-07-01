"""OpenAI client wrapper — retry, logging, token management."""

from __future__ import annotations

import json
import logging
import time
from typing import Any, TypeVar

from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

DEFAULT_MODEL = "gpt-4o-mini"
MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0


def _estimate_tokens(text: str) -> int:
    """Rough token estimate (~4 chars per token)."""
    return max(1, len(text) // 4)


async def generate_structured(
    system_prompt: str,
    user_prompt: str,
    response_model: type[T],
    model: str | None = None,
) -> tuple[T | None, dict[str, Any]]:
    """
    Call OpenAI and parse JSON into response_model.
    Returns (parsed_result, meta_dict) or (None, meta) on failure.
    """
    model = model or DEFAULT_MODEL
    meta: dict[str, Any] = {
        "model": model,
        "tokens_in": _estimate_tokens(system_prompt + user_prompt),
        "tokens_out": 0,
        "latency_ms": 0,
        "used_fallback": False,
    }

    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not configured — caller should use fallback")
        return None, meta

    start = time.perf_counter()

    try:
        from openai import AsyncOpenAI, APIError, RateLimitError

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        last_error: Exception | None = None

        for attempt in range(MAX_RETRIES):
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=2000,
                )
                content = response.choices[0].message.content or "{}"
                meta["latency_ms"] = int((time.perf_counter() - start) * 1000)
                meta["tokens_out"] = _estimate_tokens(content)
                if response.usage:
                    meta["tokens_in"] = response.usage.prompt_tokens
                    meta["tokens_out"] = response.usage.completion_tokens

                data = json.loads(content)
                # Merge sources from fallback if AI didn't include them
                parsed = response_model.model_validate(data)
                logger.info(
                    "OpenAI %s completed in %dms (in=%d, out=%d)",
                    model,
                    meta["latency_ms"],
                    meta["tokens_in"],
                    meta["tokens_out"],
                )
                return parsed, meta

            except RateLimitError as exc:
                last_error = exc
                delay = RETRY_BASE_DELAY * (2**attempt)
                logger.warning("OpenAI rate limit, retry %d in %.1fs", attempt + 1, delay)
                import asyncio

                await asyncio.sleep(delay)
            except APIError as exc:
                last_error = exc
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_BASE_DELAY * (2**attempt)
                    logger.warning("OpenAI API error, retry %d: %s", attempt + 1, exc)
                    import asyncio

                    await asyncio.sleep(delay)
                else:
                    raise

        if last_error:
            raise last_error

    except Exception as exc:
        meta["latency_ms"] = int((time.perf_counter() - start) * 1000)
        logger.error("OpenAI generation failed: %s", exc)
        return None, meta

    return None, meta
