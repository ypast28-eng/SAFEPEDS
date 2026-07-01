"""Knowledge Base admin CMS API — admin-only."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import AuthenticatedUser, get_current_user
from app.knowledge.models import (
    ArticleCreateInput,
    ArticleSummary,
    ArticleUpdateInput,
    KnowledgeCategory,
    KnowledgeReference,
    LinkBloodMarkerInput,
    LinkCompoundInput,
    ReferenceCreateInput,
)
from app.repositories import knowledge as kb_repo

router = APIRouter(prefix="/knowledge/admin", tags=["knowledge-admin"])


async def require_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    is_admin = await kb_repo.check_is_admin(user.user_id)
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


@router.get("/articles/{article_id}")
async def admin_get_article(
    article_id: str,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> dict:
    row = await kb_repo.admin_get_article_by_id(article_id)
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    return row


@router.get("/articles")
async def admin_list_articles(
    _admin: AuthenticatedUser = Depends(require_admin),
    limit: int = 50,
) -> list[ArticleSummary]:
    result = await kb_repo.search_articles(limit=limit, published_only=False)
    from app.api.routes.knowledge import _map_summary

    return [_map_summary(r) for r in result.get("articles", [])]


@router.post("/articles", response_model=ArticleSummary)
async def create_article(
    body: ArticleCreateInput,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> ArticleSummary:
    row = await kb_repo.admin_create_article(body.model_dump())
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create article")
    cats = await kb_repo.fetch_categories()
    cat = next((c for c in cats if c["id"] == body.category_id), {})
    return ArticleSummary(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        summary=row.get("summary"),
        difficulty_level=row.get("difficulty_level", "beginner"),
        view_count=0,
        published=row.get("published", False),
        image_url=row.get("image_url"),
        category=KnowledgeCategory(id=cat.get("id", ""), slug=cat.get("slug", ""), name=cat.get("name", "")),
        created_at=row.get("created_at", ""),
        updated_at=row.get("updated_at", ""),
    )


@router.patch("/articles/{article_id}", response_model=ArticleSummary)
async def update_article(
    article_id: str,
    body: ArticleUpdateInput,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> ArticleSummary:
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    row = await kb_repo.admin_update_article(article_id, payload)
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    cats = await kb_repo.fetch_categories()
    cat = next((c for c in cats if c["id"] == row.get("category_id")), {})
    return ArticleSummary(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        summary=row.get("summary"),
        difficulty_level=row.get("difficulty_level", "beginner"),
        view_count=row.get("view_count", 0),
        published=row.get("published", False),
        image_url=row.get("image_url"),
        category=KnowledgeCategory(id=cat.get("id", ""), slug=cat.get("slug", ""), name=cat.get("name", "")),
        created_at=row.get("created_at", ""),
        updated_at=row.get("updated_at", ""),
    )


@router.delete("/articles/{article_id}")
async def delete_article(
    article_id: str,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> dict:
    ok = await kb_repo.admin_delete_article(article_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"deleted": True}


@router.post("/references", response_model=KnowledgeReference)
async def create_reference(
    body: ReferenceCreateInput,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> KnowledgeReference:
    row = await kb_repo.admin_create_reference(body.model_dump())
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create reference")
    return KnowledgeReference(
        id=row["id"],
        title=row["title"],
        authors=row.get("authors"),
        journal=row.get("journal"),
        publication_year=row.get("publication_year"),
        doi=row.get("doi"),
        url=row.get("url"),
    )


@router.post("/link-compound")
async def link_compound(
    body: LinkCompoundInput,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> dict:
    ok = await kb_repo.admin_link_compound(body.model_dump())
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to link compound")
    return {"linked": True}


@router.post("/link-blood-marker")
async def link_blood_marker(
    body: LinkBloodMarkerInput,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> dict:
    ok = await kb_repo.admin_link_blood_marker(body.model_dump())
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to link blood marker")
    return {"linked": True}
