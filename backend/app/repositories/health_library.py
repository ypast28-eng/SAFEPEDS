"""Health Support Library repository."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TOPIC_SELECT = (
    "id,title,slug,category,summary,content,overview,why_it_matters,"
    "blood_markers_involved,image_url,view_count,published,created_at,updated_at"
)

FALLBACK_TOPICS = [
    {
        "id": "1",
        "title": "High Hematocrit",
        "slug": "high-hematocrit",
        "category": "Blood Health",
        "summary": "Educational overview.",
        "published": True,
        "view_count": 0,
        "blood_markers_involved": ["Hematocrit"],
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z",
    }
]


def _headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }


async def search_topics(
    *,
    query: str | None = None,
    category: str | None = None,
    blood_marker: str | None = None,
    limit: int = 24,
    offset: int = 0,
    published_only: bool = True,
) -> dict[str, Any]:
    if not settings.supabase_url or not settings.supabase_key:
        return {"topics": FALLBACK_TOPICS, "total": 1}

    topic_ids: list[str] | None = None
    if blood_marker:
        topic_ids = await _topic_ids_for_marker(blood_marker)
        if not topic_ids:
            return {"topics": [], "total": 0}

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    params: dict[str, str] = {
        "select": TOPIC_SELECT,
        "order": "title.asc",
        "limit": str(limit),
        "offset": str(offset),
    }
    if published_only:
        params["published"] = "eq.true"
    if category:
        params["category"] = f"eq.{category}"
    if topic_ids is not None:
        params["id"] = f"in.({','.join(topic_ids)})"
    if query:
        safe = query.replace("%", "")
        params["or"] = f"(title.ilike.%{safe}%,summary.ilike.%{safe}%,category.ilike.%{safe}%)"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers={**_headers(), "Prefer": "count=exact"}, params=params)
            response.raise_for_status()
            topics = response.json()
            total = _parse_range(response.headers.get("content-range")) or len(topics)
            return {"topics": topics, "total": total}
    except Exception as exc:
        logger.error("Health topic search failed: %s", exc)
        return {"topics": FALLBACK_TOPICS, "total": 1}


async def get_categories() -> list[str]:
    if not settings.supabase_url:
        return ["Blood Health", "Cardiovascular", "Liver", "Kidney", "Hormones", "General"]
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    params = {"select": "category", "published": "eq.true"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            rows = response.json()
            return sorted({r["category"] for r in rows})
    except Exception:
        return []


async def get_topic_by_slug(slug: str, increment_views: bool = True) -> dict | None:
    if not settings.supabase_url:
        return None

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    params = {"select": TOPIC_SELECT, "slug": f"eq.{slug}", "published": "eq.true", "limit": "1"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            rows = response.json()
            if not rows:
                return None
            topic = rows[0]
            await _attach_relations(topic)
            if increment_views:
                await client.post(
                    f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/increment_health_topic_view_count",
                    headers=_headers(),
                    json={"topic_slug": slug},
                )
            return topic
    except Exception as exc:
        logger.error("Get health topic failed: %s", exc)
        return None


async def get_topics_for_risk_category(risk_slug: str, limit: int = 5) -> list[dict]:
    if not settings.supabase_url:
        return []
    base = settings.supabase_url.rstrip("/")
    async with httpx.AsyncClient(timeout=15.0) as client:
        link_resp = await client.get(
            f"{base}/rest/v1/risk_category_health_topics",
            headers=_headers(),
            params={
                "risk_category_slug": f"eq.{risk_slug}",
                "select": "topic_id",
                "limit": str(limit),
            },
        )
        if link_resp.status_code != 200:
            return []
        ids = [r["topic_id"] for r in link_resp.json()]
        if not ids:
            return []
        topic_resp = await client.get(
            f"{base}/rest/v1/health_topics",
            headers=_headers(),
            params={
                "id": f"in.({','.join(ids)})",
                "published": "eq.true",
                "select": TOPIC_SELECT,
            },
        )
        return topic_resp.json() if topic_resp.status_code == 200 else []


async def _attach_relations(topic: dict) -> None:
    base = settings.supabase_url.rstrip("/")
    tid = topic["id"]
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Support options + details
        opt_resp = await client.get(
            f"{base}/rest/v1/support_options",
            headers=_headers(),
            params={"topic_id": f"eq.{tid}", "select": "*", "order": "display_order"},
        )
        options = opt_resp.json() if opt_resp.status_code == 200 else []
        for opt in options:
            det_resp = await client.get(
                f"{base}/rest/v1/support_details",
                headers=_headers(),
                params={"support_option_id": f"eq.{opt['id']}", "select": "*"},
            )
            opt["details"] = det_resp.json() if det_resp.status_code == 200 else []
        topic["support_options"] = options

        # Blood markers
        bm_resp = await client.get(
            f"{base}/rest/v1/health_topic_blood_markers",
            headers=_headers(),
            params={"topic_id": f"eq.{tid}", "select": "marker:blood_markers(id,name,category)"},
        )
        topic["related_blood_markers"] = [
            r["marker"] for r in (bm_resp.json() if bm_resp.status_code == 200 else []) if r.get("marker")
        ]

        # Compounds
        c_resp = await client.get(
            f"{base}/rest/v1/health_topic_compounds",
            headers=_headers(),
            params={"topic_id": f"eq.{tid}", "select": "compound:compounds(id,name,compound_type)"},
        )
        topic["related_compounds"] = [
            r["compound"] for r in (c_resp.json() if c_resp.status_code == 200 else []) if r.get("compound")
        ]

        # Knowledge articles
        ka_resp = await client.get(
            f"{base}/rest/v1/health_topic_knowledge_articles",
            headers=_headers(),
            params={
                "topic_id": f"eq.{tid}",
                "select": "article:knowledge_articles(id,title,slug,summary)",
            },
        )
        topic["related_knowledge_articles"] = [
            r["article"] for r in (ka_resp.json() if ka_resp.status_code == 200 else []) if r.get("article")
        ]

        # Related topics same category
        rel_resp = await client.get(
            f"{base}/rest/v1/health_topics",
            headers=_headers(),
            params={
                "category": f"eq.{topic['category']}",
                "id": f"neq.{tid}",
                "published": "eq.true",
                "select": TOPIC_SELECT,
                "limit": "4",
            },
        )
        topic["related_topics"] = rel_resp.json() if rel_resp.status_code == 200 else []


async def _topic_ids_for_marker(name: str) -> list[str]:
    base = settings.supabase_url.rstrip("/")
    safe = name.replace("%", "")
    async with httpx.AsyncClient(timeout=15.0) as client:
        m_resp = await client.get(
            f"{base}/rest/v1/blood_markers",
            headers=_headers(),
            params={"name": f"ilike.%{safe}%", "select": "id", "limit": "5"},
        )
        if m_resp.status_code != 200:
            return []
        m_ids = [m["id"] for m in m_resp.json()]
        if not m_ids:
            return []
        link_resp = await client.get(
            f"{base}/rest/v1/health_topic_blood_markers",
            headers=_headers(),
            params={"blood_marker_id": f"in.({','.join(m_ids)})", "select": "topic_id"},
        )
        return list({r["topic_id"] for r in link_resp.json()}) if link_resp.status_code == 200 else []


def _parse_range(header: str | None) -> int | None:
    if not header or "/" not in header:
        return None
    try:
        return int(header.split("/")[-1])
    except ValueError:
        return None


# Bookmarks & views (user token via service key + user_id filter)
async def get_bookmarks(user_id: str) -> list[dict]:
    base = settings.supabase_url.rstrip("/")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{base}/rest/v1/health_topic_bookmarks",
            headers=_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "select": f"topic_id,created_at,topic:health_topics({TOPIC_SELECT})",
                "order": "created_at.desc",
            },
        )
        if resp.status_code != 200:
            return []
        return [r["topic"] for r in resp.json() if r.get("topic")]


async def toggle_bookmark(user_id: str, topic_id: str) -> bool:
    base = settings.supabase_url.rstrip("/")
    async with httpx.AsyncClient(timeout=15.0) as client:
        check = await client.get(
            f"{base}/rest/v1/health_topic_bookmarks",
            headers=_headers(),
            params={"user_id": f"eq.{user_id}", "topic_id": f"eq.{topic_id}", "select": "id"},
        )
        if check.status_code == 200 and check.json():
            await client.delete(
                f"{base}/rest/v1/health_topic_bookmarks",
                headers=_headers(),
                params={"user_id": f"eq.{user_id}", "topic_id": f"eq.{topic_id}"},
            )
            return False
        await client.post(
            f"{base}/rest/v1/health_topic_bookmarks",
            headers=_headers(),
            json={"user_id": user_id, "topic_id": topic_id},
        )
        return True


async def record_view(user_id: str, topic_id: str) -> None:
    base = settings.supabase_url.rstrip("/")
    async with httpx.AsyncClient(timeout=15.0) as client:
        await client.post(
            f"{base}/rest/v1/health_topic_views",
            headers=_headers(),
            json={"user_id": user_id, "topic_id": topic_id},
        )


async def get_recent_views(user_id: str, limit: int = 10) -> list[dict]:
    base = settings.supabase_url.rstrip("/")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{base}/rest/v1/health_topic_views",
            headers=_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "select": f"viewed_at,topic:health_topics({TOPIC_SELECT})",
                "order": "viewed_at.desc",
                "limit": str(limit * 2),
            },
        )
        if resp.status_code != 200:
            return []
        seen: set[str] = set()
        out = []
        for r in resp.json():
            t = r.get("topic")
            if t and t["id"] not in seen:
                seen.add(t["id"])
                out.append(t)
            if len(out) >= limit:
                break
        return out


# Admin
async def admin_list(published_only: bool = False, limit: int = 100) -> list[dict]:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    params: dict[str, str] = {"select": TOPIC_SELECT, "order": "title.asc", "limit": str(limit)}
    if published_only:
        params["published"] = "eq.true"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_headers(), params=params)
        return response.json() if response.status_code == 200 else []


async def admin_get_by_id(topic_id: str) -> dict | None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            url, headers=_headers(), params={"id": f"eq.{topic_id}", "select": TOPIC_SELECT, "limit": "1"}
        )
        rows = response.json() if response.status_code == 200 else []
        if not rows:
            return None
        topic = rows[0]
        await _attach_relations(topic)
        return topic


async def admin_create(payload: dict) -> dict | None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    headers = {**_headers(), "Prefer": "return=representation"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        rows = response.json()
        return rows[0] if rows else None


async def admin_update(topic_id: str, payload: dict) -> dict | None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    headers = {**_headers(), "Prefer": "return=representation"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            url, headers=headers, params={"id": f"eq.{topic_id}"}, json=payload
        )
        response.raise_for_status()
        rows = response.json()
        return rows[0] if rows else None


async def admin_delete(topic_id: str) -> bool:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/health_topics"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.delete(url, headers=_headers(), params={"id": f"eq.{topic_id}"})
        return response.status_code in (200, 204)
