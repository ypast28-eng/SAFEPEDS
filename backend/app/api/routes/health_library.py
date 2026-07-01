"""Health Support Library public API."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import AuthenticatedUser, get_current_user
from app.health_library.models import (
    HealthTopicDetail,
    HealthTopicSearchRequest,
    HealthTopicSearchResult,
    HealthTopicSummary,
    RelatedBloodMarker,
    RelatedCompound,
    RelatedKnowledgeArticle,
    ScientificRef,
    SupportDetailOutput,
    SupportOptionOutput,
)
from app.repositories import health_library as hl_repo

router = APIRouter(prefix="/health-library", tags=["health-library"])


def _summary(row: dict) -> HealthTopicSummary:
    return HealthTopicSummary(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        category=row["category"],
        summary=row.get("summary"),
        view_count=row.get("view_count", 0),
        published=row.get("published", True),
        image_url=row.get("image_url"),
        blood_markers_involved=row.get("blood_markers_involved") or [],
        created_at=row.get("created_at", ""),
        updated_at=row.get("updated_at", ""),
    )


@router.get("/categories")
async def list_categories() -> list[str]:
    return await hl_repo.get_categories()


@router.get("/search", response_model=HealthTopicSearchResult)
async def search_topics(
    q: str | None = Query(None),
    category: str | None = Query(None),
    blood_marker: str | None = Query(None),
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> HealthTopicSearchResult:
    result = await hl_repo.search_topics(
        query=q, category=category, blood_marker=blood_marker, limit=limit, offset=offset
    )
    categories = await hl_repo.get_categories()
    return HealthTopicSearchResult(
        topics=[_summary(t) for t in result.get("topics", [])],
        total=result.get("total", 0),
        categories=categories,
    )


@router.get("/topics/{slug}", response_model=HealthTopicDetail)
async def get_topic(slug: str) -> HealthTopicDetail:
    row = await hl_repo.get_topic_by_slug(slug)
    if not row:
        raise HTTPException(status_code=404, detail="Topic not found")
    s = _summary(row)
    options = []
    for opt in row.get("support_options", []):
        details = []
        for d in opt.get("details", []):
            refs = [
                ScientificRef(
                    title=r.get("title", ""),
                    url=r.get("url"),
                    authors=r.get("authors"),
                    journal=r.get("journal"),
                )
                for r in (d.get("scientific_references") or [])
                if isinstance(r, dict)
            ]
            details.append(
                SupportDetailOutput(
                    id=d["id"],
                    description=d.get("description", ""),
                    scientific_references=refs,
                    notes=d.get("notes"),
                )
            )
        options.append(
            SupportOptionOutput(
                id=opt["id"],
                title=opt["title"],
                type=opt["type"],
                details=details,
            )
        )
    return HealthTopicDetail(
        **s.model_dump(),
        content=row.get("content", ""),
        overview=row.get("overview"),
        why_it_matters=row.get("why_it_matters"),
        support_options=options,
        related_blood_markers=[
            RelatedBloodMarker(id=m["id"], name=m["name"], category=m.get("category"))
            for m in row.get("related_blood_markers", [])
        ],
        related_compounds=[
            RelatedCompound(id=c["id"], name=c["name"], compound_type=c.get("compound_type"))
            for c in row.get("related_compounds", [])
        ],
        related_knowledge_articles=[
            RelatedKnowledgeArticle(
                id=a["id"], title=a["title"], slug=a["slug"], summary=a.get("summary")
            )
            for a in row.get("related_knowledge_articles", [])
        ],
        related_topics=[_summary(t) for t in row.get("related_topics", [])],
    )


@router.get("/risk/{risk_category_slug}/topics")
async def topics_for_risk(risk_category_slug: str) -> list[HealthTopicSummary]:
    rows = await hl_repo.get_topics_for_risk_category(risk_category_slug)
    return [_summary(t) for t in rows]


@router.get("/bookmarks")
async def get_bookmarks(user: AuthenticatedUser = Depends(get_current_user)) -> list[HealthTopicSummary]:
    rows = await hl_repo.get_bookmarks(user.user_id)
    return [_summary(t) for t in rows]


@router.post("/bookmarks/{topic_id}")
async def toggle_bookmark(
    topic_id: str, user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    added = await hl_repo.toggle_bookmark(user.user_id, topic_id)
    return {"bookmarked": added}


@router.post("/views/{topic_id}")
async def record_view(
    topic_id: str, user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    await hl_repo.record_view(user.user_id, topic_id)
    return {"recorded": True}


@router.get("/recent")
async def recent_views(
    user: AuthenticatedUser = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=20),
) -> list[HealthTopicSummary]:
    rows = await hl_repo.get_recent_views(user.user_id, limit)
    return [_summary(t) for t in rows]
