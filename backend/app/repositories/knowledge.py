"""Knowledge Base repository — Supabase REST access."""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

FALLBACK_CATEGORIES = [
    {"id": "1", "slug": "general-health", "name": "General Health"},
    {"id": "2", "slug": "bloodwork", "name": "Bloodwork"},
]

FALLBACK_ARTICLES = [
    {
        "id": "1",
        "title": "Understanding Liver Enzymes (ALT & AST)",
        "slug": "understanding-liver-enzymes",
        "summary": "Educational overview of hepatic markers.",
        "difficulty_level": "beginner",
        "view_count": 0,
        "published": True,
        "category": {"id": "1", "slug": "liver-health", "name": "Liver Health"},
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


def _article_select() -> str:
    return (
        "id,title,slug,summary,content,difficulty_level,view_count,published,"
        "image_url,created_at,updated_at,category_id,"
        "category:knowledge_categories(id,slug,name,description)"
    )


async def fetch_categories() -> list[dict]:
    if not settings.supabase_url or not settings.supabase_key:
        return FALLBACK_CATEGORIES

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_categories"
    params = {"select": "*", "order": "display_order"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            return response.json() or FALLBACK_CATEGORIES
    except Exception as exc:
        logger.error("Failed to fetch categories: %s", exc)
        return FALLBACK_CATEGORIES


async def search_articles(
    *,
    query: str | None = None,
    category_slug: str | None = None,
    difficulty: str | None = None,
    compound: str | None = None,
    blood_marker: str | None = None,
    peptide: str | None = None,
    sarm: str | None = None,
    sort: str = "newest",
    limit: int = 20,
    offset: int = 0,
    published_only: bool = True,
) -> dict[str, Any]:
    if not settings.supabase_url or not settings.supabase_key:
        return {"articles": FALLBACK_ARTICLES, "total": len(FALLBACK_ARTICLES)}

    # Build keyword from specialized filters
    keyword_parts = [p for p in [query, compound, blood_marker, peptide, sarm] if p]
    keyword = " ".join(keyword_parts) if keyword_parts else None

    # Resolve article IDs from junction tables when filtering by compound/marker
    article_ids: list[str] | None = None

    if compound:
        article_ids = await _article_ids_for_compound(compound)
    elif blood_marker:
        article_ids = await _article_ids_for_marker(blood_marker)
    elif peptide:
        article_ids = await _article_ids_for_compound(peptide, category_hint="peptides")
    elif sarm:
        article_ids = await _article_ids_for_compound(sarm, category_hint="sarms")

    if article_ids is not None and len(article_ids) == 0:
        return {"articles": [], "total": 0}

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_articles"
    params: dict[str, str] = {
        "select": _article_select(),
        "limit": str(limit),
        "offset": str(offset),
    }

    if published_only:
        params["published"] = "eq.true"

    if category_slug:
        cat_id = await _category_id_by_slug(category_slug)
        if cat_id:
            params["category_id"] = f"eq.{cat_id}"

    if difficulty:
        params["difficulty_level"] = f"eq.{difficulty}"

    if article_ids is not None:
        params["id"] = f"in.({','.join(article_ids)})"

    if keyword:
        # Full-text search via RPC or ilike fallback
        fts_results = await _fts_search(keyword, limit=limit + offset)
        if fts_results is not None:
            if offset:
                fts_results = fts_results[offset:]
            return {"articles": fts_results[:limit], "total": len(fts_results)}

        safe = keyword.replace("%", "").replace(",", " ")
        params["or"] = f"(title.ilike.%{safe}%,summary.ilike.%{safe}%,content.ilike.%{safe}%)"

    order = "created_at.desc"
    if sort == "popular":
        order = "view_count.desc"
    elif sort == "updated":
        order = "updated_at.desc"
    params["order"] = order

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers={**_headers(), "Prefer": "count=exact"}, params=params)
            response.raise_for_status()
            articles = response.json()
            total = _parse_content_range(response.headers.get("content-range"))
            return {"articles": articles, "total": total if total is not None else len(articles)}
    except Exception as exc:
        logger.error("Search failed: %s", exc)
        return {"articles": FALLBACK_ARTICLES, "total": len(FALLBACK_ARTICLES)}


async def _fts_search(keyword: str, limit: int = 20) -> list[dict] | None:
    """Use PostgREST textSearch if search_vector is populated."""
    if not settings.supabase_url:
        return None

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_articles"
    params = {
        "select": _article_select(),
        "published": "eq.true",
        "search_vector": f"plfts.{keyword}",
        "order": "view_count.desc",
        "limit": str(limit),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            if response.status_code == 200:
                data = response.json()
                if data:
                    return data
    except Exception:
        pass
    return None


async def get_article_by_slug(slug: str, increment_views: bool = True) -> dict | None:
    if not settings.supabase_url or not settings.supabase_key:
        return None

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_articles"
    params = {
        "select": _article_select(),
        "slug": f"eq.{slug}",
        "published": "eq.true",
        "limit": "1",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_headers(), params=params)
            response.raise_for_status()
            rows = response.json()
            if not rows:
                return None

            article = rows[0]
            article_id = article["id"]

            refs, compounds, markers, related = await _fetch_article_relations(article_id, article.get("category_id"))
            article["references"] = refs
            article["related_compounds"] = compounds
            article["related_blood_markers"] = markers
            article["related_articles"] = related

            if increment_views:
                await client.post(
                    f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/increment_article_view_count",
                    headers=_headers(),
                    json={"article_slug": slug},
                )

            return article
    except Exception as exc:
        logger.error("Get article failed: %s", exc)
        return None


async def _fetch_article_relations(article_id: str, category_id: str | None) -> tuple:
    base = settings.supabase_url.rstrip("/")
    headers = _headers()

    async with httpx.AsyncClient(timeout=15.0) as client:
        refs_resp = await client.get(
            f"{base}/rest/v1/knowledge_references",
            headers=headers,
            params={"article_id": f"eq.{article_id}", "select": "*"},
        )
        refs = refs_resp.json() if refs_resp.status_code == 200 else []

        comp_resp = await client.get(
            f"{base}/rest/v1/compound_articles",
            headers=headers,
            params={
                "article_id": f"eq.{article_id}",
                "select": "compound:compounds(id,name,compound_type)",
            },
        )
        compounds = []
        if comp_resp.status_code == 200:
            for row in comp_resp.json():
                if row.get("compound"):
                    compounds.append(row["compound"])

        marker_resp = await client.get(
            f"{base}/rest/v1/blood_marker_articles",
            headers=headers,
            params={
                "article_id": f"eq.{article_id}",
                "select": "marker:blood_markers(id,name,category)",
            },
        )
        markers = []
        if marker_resp.status_code == 200:
            for row in marker_resp.json():
                if row.get("marker"):
                    markers.append(row["marker"])

        related_params: dict[str, str] = {
            "select": _article_select(),
            "published": "eq.true",
            "id": f"neq.{article_id}",
            "limit": "4",
            "order": "view_count.desc",
        }
        if category_id:
            related_params["category_id"] = f"eq.{category_id}"

        related_resp = await client.get(
            f"{base}/rest/v1/knowledge_articles",
            headers=headers,
            params=related_params,
        )
        related = related_resp.json() if related_resp.status_code == 200 else []

    return refs, compounds, markers, related


async def fetch_featured() -> dict[str, list]:
    newest = await search_articles(sort="newest", limit=6)
    popular = await search_articles(sort="popular", limit=6)
    updated = await search_articles(sort="updated", limit=6)
    return {
        "newest": newest.get("articles", []),
        "popular": popular.get("articles", []),
        "recently_updated": updated.get("articles", []),
    }


async def _category_id_by_slug(slug: str) -> str | None:
    cats = await fetch_categories()
    for c in cats:
        if c.get("slug") == slug:
            return c.get("id")
    return None


async def _article_ids_for_compound(name: str, category_hint: str | None = None) -> list[str]:
    base = settings.supabase_url.rstrip("/")
    safe = name.replace("%", "")

    async with httpx.AsyncClient(timeout=15.0) as client:
        comp_params: dict[str, str] = {
            "select": "id",
            "name": f"ilike.%{safe}%",
            "limit": "10",
        }
        if category_hint:
            # Filter by compound category name via join not available — use name only
            pass

        comp_resp = await client.get(
            f"{base}/rest/v1/compounds",
            headers=_headers(),
            params=comp_params,
        )
        if comp_resp.status_code != 200:
            return []
        compound_ids = [c["id"] for c in comp_resp.json()]
        if not compound_ids:
            return []

        link_resp = await client.get(
            f"{base}/rest/v1/compound_articles",
            headers=_headers(),
            params={
                "compound_id": f"in.({','.join(compound_ids)})",
                "select": "article_id",
            },
        )
        if link_resp.status_code != 200:
            return []
        return list({r["article_id"] for r in link_resp.json()})


async def _article_ids_for_marker(name: str) -> list[str]:
    base = settings.supabase_url.rstrip("/")
    safe = name.replace("%", "")

    async with httpx.AsyncClient(timeout=15.0) as client:
        marker_resp = await client.get(
            f"{base}/rest/v1/blood_markers",
            headers=_headers(),
            params={"name": f"ilike.%{safe}%", "select": "id", "limit": "10"},
        )
        if marker_resp.status_code != 200:
            return []
        marker_ids = [m["id"] for m in marker_resp.json()]
        if not marker_ids:
            return []

        link_resp = await client.get(
            f"{base}/rest/v1/blood_marker_articles",
            headers=_headers(),
            params={
                "blood_marker_id": f"in.({','.join(marker_ids)})",
                "select": "article_id",
            },
        )
        if link_resp.status_code != 200:
            return []
        return list({r["article_id"] for r in link_resp.json()})


def _parse_content_range(header: str | None) -> int | None:
    if not header or "/" not in header:
        return None
    try:
        return int(header.split("/")[-1])
    except ValueError:
        return None


# ─── Admin CRUD ──────────────────────────────────────────────────────────────


async def admin_get_article_by_id(article_id: str) -> dict | None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_articles"
    params = {
        "select": _article_select(),
        "id": f"eq.{article_id}",
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_headers(), params=params)
        if response.status_code != 200:
            return None
        rows = response.json()
        if not rows:
            return None
        article = rows[0]
        refs, compounds, markers, related = await _fetch_article_relations(
            article["id"], article.get("category_id")
        )
        article["references"] = refs
        article["related_compounds"] = compounds
        article["related_blood_markers"] = markers
        article["related_articles"] = related
        return article


async def admin_create_article(payload: dict) -> dict | None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_articles"
    headers = {**_headers(), "Prefer": "return=representation"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        rows = response.json()
        return rows[0] if rows else None


async def admin_update_article(article_id: str, payload: dict) -> dict | None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_articles"
    headers = {**_headers(), "Prefer": "return=representation"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            url, headers=headers, params={"id": f"eq.{article_id}"}, json=payload
        )
        response.raise_for_status()
        rows = response.json()
        return rows[0] if rows else None


async def admin_delete_article(article_id: str) -> bool:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_articles"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.delete(
            url, headers=_headers(), params={"id": f"eq.{article_id}"}
        )
        return response.status_code in (200, 204)


async def admin_create_reference(payload: dict) -> dict | None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/knowledge_references"
    headers = {**_headers(), "Prefer": "return=representation"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        rows = response.json()
        return rows[0] if rows else None


async def admin_link_compound(payload: dict) -> bool:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/compound_articles"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_headers(), json=payload)
        return response.status_code in (200, 201)


async def admin_link_blood_marker(payload: dict) -> bool:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/blood_marker_articles"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_headers(), json=payload)
        return response.status_code in (200, 201)


async def check_is_admin(user_id: str) -> bool:
    if not settings.supabase_url or not settings.supabase_key:
        return False

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/profiles"
    params = {"id": f"eq.{user_id}", "select": "is_admin", "limit": "1"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=_headers(), params=params)
        if response.status_code != 200:
            return False
        rows = response.json()
        return bool(rows and rows[0].get("is_admin"))
