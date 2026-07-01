"""AI Health Intelligence service — orchestrates prompts, OpenAI, fallback, audit."""

from __future__ import annotations

import logging
from typing import Any

from app.ai import client as openai_client
from app.ai import fallback
from app.ai import prompts
from app.ai.models import (
    AI_DISCLAIMER,
    AiBloodworkReportRequest,
    AiBloodworkReportResult,
    AiChatRequest,
    AiChatResponse,
    AiCycleReportRequest,
    AiCycleReportResult,
    AiInsightsRequest,
    AiInsightsResult,
    AiSourceReference,
    AiTimelineRequest,
    AiTimelineResult,
)
from app.ai.prompts import SYSTEM_PROMPT
from app.ai.rate_limiter import ai_rate_limiter
from app.ai.security import validate_chat_message
from app.repositories import ai as ai_repo

logger = logging.getLogger(__name__)


def _merge_sources(
    result_articles: list[AiSourceReference],
    result_refs: list[AiSourceReference],
    articles: list[dict],
    references: list[dict],
) -> tuple[list[AiSourceReference], list[AiSourceReference]]:
    """Ensure platform sources are always attached."""
    article_sources = result_articles or [
        AiSourceReference(
            title=a.get("title", ""),
            url=f"/knowledge-base?article={a.get('slug', '')}",
            source_type="article",
        )
        for a in articles[:5]
    ]
    sci_sources = result_refs or [
        AiSourceReference(
            title=r.get("title", ""),
            url=r.get("url"),
            citation_text=r.get("citation_text"),
            source_type="scientific",
        )
        for r in references[:5]
    ]
    return article_sources, sci_sources


async def _load_education(tags: list[str] | None = None) -> tuple[list[dict], list[dict]]:
    articles = await ai_repo.fetch_articles(tags=tags)
    references = await ai_repo.fetch_references()
    return articles, references


async def _generate_or_fallback(
    feature: str,
    user_id: str,
    context: dict[str, Any],
    prompt_builder,
    response_model: type,
    fallback_fn,
    tags: list[str] | None = None,
    source_id: str | None = None,
    report_type: str | None = None,
):
    allowed, retry_after = ai_rate_limiter.check(user_id)
    if not allowed:
        raise ValueError(f"Rate limit exceeded. Try again in {retry_after} seconds.")

    articles, references = await _load_education(tags)
    user_prompt = prompt_builder(context, articles)
    p_hash = ai_repo.prompt_hash(user_prompt)

    parsed, meta = await openai_client.generate_structured(
        SYSTEM_PROMPT,
        user_prompt,
        response_model,
    )

    if parsed is None:
        meta["used_fallback"] = True
        result = fallback_fn(context, articles, references)
    else:
        result = parsed
        # Attach sources from platform if AI response lacks them
        arts, refs = _merge_sources(
            getattr(result, "related_articles", []),
            getattr(result, "scientific_references", []),
            articles,
            references,
        )
        if hasattr(result, "related_articles"):
            result.related_articles = arts
        if hasattr(result, "scientific_references"):
            result.scientific_references = refs

    await ai_repo.log_audit(
        user_id=user_id,
        feature=feature,
        input_snapshot=context,
        output_snapshot=result.model_dump() if hasattr(result, "model_dump") else {},
        model=meta.get("model"),
        prompt_hash_val=p_hash,
        tokens_in=meta.get("tokens_in", 0),
        tokens_out=meta.get("tokens_out", 0),
        latency_ms=meta.get("latency_ms", 0),
        status="success",
    )

    if report_type:
        await ai_repo.save_report(
            user_id,
            report_type,
            result.model_dump(),
            source_id=source_id,
            model=meta.get("model"),
        )

    return result


async def generate_bloodwork_report(
    user_id: str,
    request: AiBloodworkReportRequest,
) -> AiBloodworkReportResult:
    context = request.model_dump()
    tags = [m.marker_name.lower() for m in request.report.markers[:5]]

    return await _generate_or_fallback(
        feature="bloodwork_report",
        user_id=user_id,
        context=context,
        prompt_builder=lambda ctx, arts: prompts.build_bloodwork_prompt(ctx, arts),
        response_model=AiBloodworkReportResult,
        fallback_fn=fallback.generate_bloodwork_report,
        tags=tags,
        source_id=request.report.report_id,
        report_type="bloodwork",
    )


async def generate_cycle_report(
    user_id: str,
    request: AiCycleReportRequest,
) -> AiCycleReportResult:
    context = request.model_dump()

    return await _generate_or_fallback(
        feature="cycle_report",
        user_id=user_id,
        context=context,
        prompt_builder=lambda ctx, arts: prompts.build_cycle_prompt(ctx, arts),
        response_model=AiCycleReportResult,
        fallback_fn=fallback.generate_cycle_report,
        tags=["cycles", "risk"],
        source_id=request.cycle.cycle_id,
        report_type="cycle",
    )


async def generate_timeline(
    user_id: str,
    request: AiTimelineRequest,
) -> AiTimelineResult:
    context = request.model_dump()

    return await _generate_or_fallback(
        feature="timeline",
        user_id=user_id,
        context=context,
        prompt_builder=lambda ctx, _: prompts.build_timeline_prompt(ctx),
        response_model=AiTimelineResult,
        fallback_fn=fallback.generate_timeline,
        report_type="timeline",
    )


async def generate_insights(
    user_id: str,
    request: AiInsightsRequest,
) -> AiInsightsResult:
    context = request.model_dump()
    tags = list({t.marker_name.lower() for t in request.bloodwork_trends[:10]})

    return await _generate_or_fallback(
        feature="insights",
        user_id=user_id,
        context=context,
        prompt_builder=lambda ctx, _: prompts.build_insights_prompt(ctx),
        response_model=AiInsightsResult,
        fallback_fn=fallback.generate_insights,
        tags=tags,
        report_type="insights",
    )


async def chat(
    user_id: str,
    request: AiChatRequest,
) -> AiChatResponse:
    allowed, retry_after = ai_rate_limiter.check(user_id)
    if not allowed:
        raise ValueError(f"Rate limit exceeded. Try again in {retry_after} seconds.")

    sanitized, block_reason = validate_chat_message(request.message)
    if block_reason:
        await ai_repo.log_audit(
            user_id=user_id,
            feature="chat",
            input_snapshot={"message": sanitized, "blocked": block_reason},
            output_snapshot=None,
            model=None,
            prompt_hash_val="",
            tokens_in=0,
            tokens_out=0,
            latency_ms=0,
            status="blocked",
            error_message=block_reason,
        )
        return AiChatResponse(
            reply=(
                "I can only provide general educational information about your logged data. "
                "I cannot provide individualized medical advice, prescribe compounds, "
                "diagnose conditions, or assess whether a cycle is safe. "
                "Please ask an educational question about your markers, trends, or risk scores."
            ),
            sources=[],
            disclaimer=AI_DISCLAIMER,
        )

    articles, references = await _load_education()
    memory = await ai_repo.fetch_user_memory(user_id)
    context = request.model_dump(exclude={"message"})

    user_prompt = prompts.build_chat_prompt(sanitized, context, articles, memory)
    p_hash = ai_repo.prompt_hash(user_prompt)

    parsed, meta = await openai_client.generate_structured(
        SYSTEM_PROMPT,
        user_prompt,
        AiChatResponse,
    )

    if parsed is None:
        meta["used_fallback"] = True
        result = fallback.generate_chat_reply(sanitized, context, articles, references)
    else:
        arts, refs = _merge_sources(parsed.sources, [], articles, references)
        result = AiChatResponse(
            reply=parsed.reply,
            sources=arts + refs,
            disclaimer=AI_DISCLAIMER,
        )

    await ai_repo.save_chat_message(user_id, "user", sanitized, [])
    await ai_repo.save_chat_message(
        user_id,
        "assistant",
        result.reply,
        [s.model_dump() for s in result.sources],
    )

    await ai_repo.upsert_memory(
        user_id,
        "conversation_summary",
        {"last_question": sanitized, "last_topic": request.context_type},
    )

    await ai_repo.log_audit(
        user_id=user_id,
        feature="chat",
        input_snapshot={"message": sanitized, "context_type": request.context_type},
        output_snapshot=result.model_dump(),
        model=meta.get("model"),
        prompt_hash_val=p_hash,
        tokens_in=meta.get("tokens_in", 0),
        tokens_out=meta.get("tokens_out", 0),
        latency_ms=meta.get("latency_ms", 0),
        status="success",
    )

    return result


async def get_chat_history(user_id: str, limit: int = 20) -> list[dict]:
    return await ai_repo.fetch_chat_history(user_id, limit)
