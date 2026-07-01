"""RAG retrieval from Health Support Library — primary AI health content source."""

from __future__ import annotations

from app.repositories import health_library as hl_repo


async def retrieve_for_query(
    query: str | None = None,
    blood_markers: list[str] | None = None,
    risk_category: str | None = None,
    limit: int = 5,
) -> list[dict]:
    """Retrieve health topics for AI context — prioritized over invented content."""
    results: list[dict] = []
    seen: set[str] = set()

    if risk_category:
        topics = await hl_repo.get_topics_for_risk_category(risk_category, limit=limit)
        for t in topics:
            if t["slug"] not in seen:
                seen.add(t["slug"])
                results.append(_to_context(t))

    if blood_markers:
        for marker in blood_markers[:6]:
            search = await hl_repo.search_topics(blood_marker=marker, limit=2)
            for t in search.get("topics", []):
                if t["slug"] not in seen:
                    seen.add(t["slug"])
                    results.append(_to_context(t))

    if query:
        search = await hl_repo.search_topics(query=query, limit=limit)
        for t in search.get("topics", []):
            if t["slug"] not in seen:
                seen.add(t["slug"])
                results.append(_to_context(t))

    return results[:limit]


async def retrieve_by_slugs(slugs: list[str]) -> list[dict]:
    out = []
    for slug in slugs[:5]:
        topic = await hl_repo.get_topic_by_slug(slug, increment_views=False)
        if topic:
            out.append(_to_context(topic, full=True))
    return out


def _to_context(row: dict, full: bool = False) -> dict:
    ctx = {
        "slug": row.get("slug"),
        "title": row.get("title"),
        "category": row.get("category"),
        "summary": row.get("summary"),
        "overview": row.get("overview"),
        "why_it_matters": row.get("why_it_matters"),
        "source_type": "health_library",
        "url": f"/health-library/{row.get('slug')}",
    }
    if full:
        ctx["content_excerpt"] = (row.get("content") or "")[:800]
        ctx["blood_markers"] = row.get("blood_markers_involved", [])
    return ctx
