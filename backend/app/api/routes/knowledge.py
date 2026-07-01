"""Knowledge Base public API routes."""

from fastapi import APIRouter, HTTPException, Query

from app.knowledge.models import (
    ArticleDetail,
    ArticleSummary,
    FeaturedArticles,
    KnowledgeCategory,
    KnowledgeSearchRequest,
    KnowledgeSearchResult,
)
from app.repositories import knowledge as kb_repo

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


def _map_summary(row: dict) -> ArticleSummary:
    cat = row.get("category") or {}
    return ArticleSummary(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        summary=row.get("summary"),
        difficulty_level=row.get("difficulty_level", "beginner"),
        view_count=row.get("view_count", 0),
        published=row.get("published", True),
        image_url=row.get("image_url"),
        category=KnowledgeCategory(
            id=cat.get("id", ""),
            slug=cat.get("slug", ""),
            name=cat.get("name", ""),
            description=cat.get("description"),
        ),
        created_at=row.get("created_at", ""),
        updated_at=row.get("updated_at", ""),
    )


@router.get("/categories", response_model=list[KnowledgeCategory])
async def list_categories() -> list[KnowledgeCategory]:
    rows = await kb_repo.fetch_categories()
    return [
        KnowledgeCategory(
            id=r["id"],
            slug=r["slug"],
            name=r["name"],
            description=r.get("description"),
        )
        for r in rows
    ]


@router.post("/search", response_model=KnowledgeSearchResult)
async def search_articles(body: KnowledgeSearchRequest) -> KnowledgeSearchResult:
    result = await kb_repo.search_articles(
        query=body.query,
        category_slug=body.category_slug,
        difficulty=body.difficulty,
        compound=body.compound,
        blood_marker=body.blood_marker,
        peptide=body.peptide,
        sarm=body.sarm,
        sort=body.sort,
        limit=body.limit,
        offset=body.offset,
    )
    articles = [_map_summary(r) for r in result.get("articles", [])]
    return KnowledgeSearchResult(
        articles=articles,
        total=result.get("total", len(articles)),
        query=body.query,
    )


@router.get("/search", response_model=KnowledgeSearchResult)
async def search_articles_get(
    q: str | None = Query(None),
    category: str | None = Query(None),
    difficulty: str | None = Query(None),
    compound: str | None = Query(None),
    blood_marker: str | None = Query(None),
    peptide: str | None = Query(None),
    sarm: str | None = Query(None),
    sort: str = Query("newest"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> KnowledgeSearchResult:
    body = KnowledgeSearchRequest(
        query=q,
        category_slug=category,
        difficulty=difficulty,  # type: ignore[arg-type]
        compound=compound,
        blood_marker=blood_marker,
        peptide=peptide,
        sarm=sarm,
        sort=sort,  # type: ignore[arg-type]
        limit=limit,
        offset=offset,
    )
    return await search_articles(body)


@router.get("/featured", response_model=FeaturedArticles)
async def featured_articles() -> FeaturedArticles:
    data = await kb_repo.fetch_featured()
    return FeaturedArticles(
        newest=[_map_summary(r) for r in data.get("newest", [])],
        popular=[_map_summary(r) for r in data.get("popular", [])],
        recently_updated=[_map_summary(r) for r in data.get("recently_updated", [])],
    )


@router.get("/articles/{slug}", response_model=ArticleDetail)
async def get_article(slug: str) -> ArticleDetail:
    row = await kb_repo.get_article_by_slug(slug)
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")

    summary = _map_summary(row)
    from app.knowledge.models import KnowledgeReference, RelatedBloodMarker, RelatedCompound

    return ArticleDetail(
        **summary.model_dump(),
        content=row.get("content", ""),
        references=[
            KnowledgeReference(
                id=r["id"],
                title=r["title"],
                authors=r.get("authors"),
                journal=r.get("journal"),
                publication_year=r.get("publication_year"),
                doi=r.get("doi"),
                url=r.get("url"),
            )
            for r in row.get("references", [])
        ],
        related_compounds=[
            RelatedCompound(id=c["id"], name=c["name"], compound_type=c.get("compound_type"))
            for c in row.get("related_compounds", [])
        ],
        related_blood_markers=[
            RelatedBloodMarker(id=m["id"], name=m["name"], category=m.get("category"))
            for m in row.get("related_blood_markers", [])
        ],
        related_articles=[_map_summary(r) for r in row.get("related_articles", [])],
    )
