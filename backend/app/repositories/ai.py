"""AI persistence — memory, audit logs, reports, educational content."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

FALLBACK_ARTICLES = [
    {
        "slug": "understanding-liver-enzymes",
        "title": "Understanding Liver Enzymes (ALT & AST)",
        "category": "bloodwork",
        "summary": "Educational overview of hepatic markers.",
    },
    {
        "slug": "hdl-cholesterol-monitoring",
        "title": "HDL Cholesterol: Why It Is Monitored",
        "category": "bloodwork",
        "summary": "Educational context on HDL.",
    },
]


def _headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }


def prompt_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


async def fetch_articles(tags: list[str] | None = None, limit: int = 10) -> list[dict]:
    if not settings.supabase_url or not settings.supabase_key:
        return FALLBACK_ARTICLES

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/educational_articles"
    params: dict[str, str] = {
        "published": "eq.true",
        "select": "slug,title,category,summary,body,tags",
        "order": "display_order",
        "limit": str(limit),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            rows = response.json()
            if tags:
                filtered = [
                    r for r in rows if any(t in (r.get("tags") or []) for t in tags)
                ]
                return filtered or rows
            return rows or FALLBACK_ARTICLES
    except Exception as exc:
        logger.error("Failed to fetch articles: %s", exc)
        return FALLBACK_ARTICLES


async def fetch_references(article_slugs: list[str] | None = None, limit: int = 10) -> list[dict]:
    if not settings.supabase_url or not settings.supabase_key:
        return [
            {
                "title": "NIH MedlinePlus",
                "url": "https://medlineplus.gov/",
                "citation_text": "U.S. National Library of Medicine.",
            }
        ]

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/educational_references"
    params: dict[str, str] = {
        "select": "title,url,citation_text,evidence_level,article_id",
        "order": "display_order",
        "limit": str(limit),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            return response.json() or []
    except Exception as exc:
        logger.error("Failed to fetch references: %s", exc)
        return []


async def fetch_user_memory(user_id: str) -> list[dict]:
    if not settings.supabase_url or not settings.supabase_key:
        return []

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_memory"
    params = {
        "user_id": f"eq.{user_id}",
        "select": "memory_type,context_key,content",
        "limit": "20",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            return response.json()
    except Exception as exc:
        logger.error("Failed to fetch AI memory: %s", exc)
        return []


async def upsert_memory(
    user_id: str,
    memory_type: str,
    content: dict,
    context_key: str = "default",
) -> None:
    if not settings.supabase_url or not settings.supabase_key:
        return

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_memory"
    headers = {**_headers(), "Prefer": "resolution=merge-duplicates"}
    payload = {
        "user_id": user_id,
        "memory_type": memory_type,
        "context_key": context_key,
        "content": content,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.post(
                url,
                headers=headers,
                params={"on_conflict": "user_id,memory_type,context_key"},
                json=payload,
            )
    except Exception as exc:
        logger.error("Failed to upsert AI memory: %s", exc)


async def log_audit(
    user_id: str,
    feature: str,
    input_snapshot: dict,
    output_snapshot: dict | None,
    model: str | None,
    prompt_hash_val: str,
    tokens_in: int,
    tokens_out: int,
    latency_ms: int,
    status: str = "success",
    error_message: str | None = None,
) -> None:
    if not settings.supabase_url or not settings.supabase_key:
        logger.info(
            "AI audit [%s] user=%s status=%s latency=%dms",
            feature,
            user_id,
            status,
            latency_ms,
        )
        return

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_audit_logs"
    payload = {
        "user_id": user_id,
        "feature": feature,
        "model": model,
        "prompt_hash": prompt_hash_val,
        "input_snapshot": input_snapshot,
        "output_snapshot": output_snapshot,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "latency_ms": latency_ms,
        "status": status,
        "error_message": error_message,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.post(url, headers=_headers(), json=payload)
    except Exception as exc:
        logger.error("Failed to log AI audit: %s", exc)


async def save_report(
    user_id: str,
    report_type: str,
    content: dict,
    source_id: str | None = None,
    model: str | None = None,
) -> str | None:
    if not settings.supabase_url or not settings.supabase_key:
        return None

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_reports"
    headers = {**_headers(), "Prefer": "return=representation"}
    payload = {
        "user_id": user_id,
        "report_type": report_type,
        "source_id": source_id,
        "model": model,
        "content": content,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            rows = response.json()
            return rows[0]["id"] if rows else None
    except Exception as exc:
        logger.error("Failed to save AI report: %s", exc)
        return None


async def save_chat_message(
    user_id: str,
    role: str,
    content: str,
    sources: list[dict],
) -> None:
    if not settings.supabase_url or not settings.supabase_key:
        return

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_chat_messages"
    payload = {
        "user_id": user_id,
        "role": role,
        "content": content,
        "sources": sources,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.post(url, headers=_headers(), json=payload)
    except Exception as exc:
        logger.error("Failed to save chat message: %s", exc)


async def fetch_chat_history(user_id: str, limit: int = 20) -> list[dict]:
    if not settings.supabase_url or not settings.supabase_key:
        return []

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_chat_messages"
    params = {
        "user_id": f"eq.{user_id}",
        "select": "role,content,sources,created_at",
        "order": "created_at.desc",
        "limit": str(limit),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            return list(reversed(response.json()))
    except Exception as exc:
        logger.error("Failed to fetch chat history: %s", exc)
        return []
