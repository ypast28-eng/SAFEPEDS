"""RAG retrieval — Knowledge Base articles as primary AI context."""

from __future__ import annotations

import logging
import re
from typing import Any

from app.repositories import knowledge as kb_repo

logger = logging.getLogger(__name__)

STOP_WORDS = frozenset(
    "a an the is are was were be been being have has had do does did will would "
    "could should may might must shall can what how why when where my me i".split()
)


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return [t for t in tokens if len(t) > 2 and t not in STOP_WORDS]


async def retrieve_for_query(
    query: str,
    *,
    category_slug: str | None = None,
    compound: str | None = None,
    blood_marker: str | None = None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """
    Retrieve relevant knowledge articles for AI context.
    Prioritizes Knowledge Base over general generation.
    """
    search_query = query
    if blood_marker and blood_marker.lower() not in (search_query or "").lower():
        search_query = f"{search_query or ''} {blood_marker}".strip()
    if compound and compound.lower() not in (search_query or "").lower():
        search_query = f"{search_query or ''} {compound}".strip()

    result = await kb_repo.search_articles(
        query=search_query or None,
        category_slug=category_slug,
        compound=compound,
        blood_marker=blood_marker,
        sort="popular",
        limit=limit,
        published_only=True,
    )

    articles = []
    for article in result.get("articles", []):
        articles.append(
            {
                "slug": article.get("slug"),
                "title": article.get("title"),
                "summary": article.get("summary"),
                "category": article.get("category", {}).get("name"),
                "content_excerpt": (article.get("summary") or "")[:500],
                "source_type": "knowledge_base",
            }
        )

    if not articles and blood_marker:
        result = await kb_repo.search_articles(
            blood_marker=blood_marker,
            limit=limit,
            published_only=True,
        )
        for article in result.get("articles", []):
            articles.append(
                {
                    "slug": article.get("slug"),
                    "title": article.get("title"),
                    "summary": article.get("summary"),
                    "source_type": "knowledge_base",
                }
            )

    return articles[:limit]


async def retrieve_for_markers(marker_names: list[str], limit: int = 5) -> list[dict[str, Any]]:
    """Retrieve articles linked to blood markers."""
    seen: set[str] = set()
    results: list[dict[str, Any]] = []

    for marker in marker_names[:8]:
        batch = await retrieve_for_query("", blood_marker=marker, limit=2)
        for item in batch:
            slug = item.get("slug", "")
            if slug and slug not in seen:
                seen.add(slug)
                results.append(item)

    return results[:limit]


async def retrieve_references_for_articles(article_slugs: list[str]) -> list[dict[str, Any]]:
    """Fetch scientific references for retrieved articles."""
    refs: list[dict[str, Any]] = []
    for slug in article_slugs[:5]:
        detail = await kb_repo.get_article_by_slug(slug, increment_views=False)
        if not detail:
            continue
        for ref in detail.get("references", []):
            refs.append(
                {
                    "title": ref.get("title"),
                    "authors": ref.get("authors"),
                    "journal": ref.get("journal"),
                    "publication_year": ref.get("publication_year"),
                    "doi": ref.get("doi"),
                    "url": ref.get("url"),
                    "source_type": "scientific",
                }
            )
    return refs[:10]
