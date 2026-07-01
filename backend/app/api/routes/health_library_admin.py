"""Health Support Library admin CMS."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import AuthenticatedUser, get_current_user
from app.health_library.models import HealthTopicCreateInput, HealthTopicSummary, HealthTopicUpdateInput
from app.repositories import health_library as hl_repo
from app.repositories import knowledge as kb_repo

router = APIRouter(prefix="/health-library/admin", tags=["health-library-admin"])


async def require_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    if not await kb_repo.check_is_admin(user.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def _summary(row: dict) -> HealthTopicSummary:
    return HealthTopicSummary(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        category=row["category"],
        summary=row.get("summary"),
        view_count=row.get("view_count", 0),
        published=row.get("published", False),
        image_url=row.get("image_url"),
        blood_markers_involved=row.get("blood_markers_involved") or [],
        created_at=row.get("created_at", ""),
        updated_at=row.get("updated_at", ""),
    )


@router.get("/topics")
async def list_topics(_admin: AuthenticatedUser = Depends(require_admin)) -> list[HealthTopicSummary]:
    rows = await hl_repo.admin_list(published_only=False)
    return [_summary(r) for r in rows]


@router.get("/topics/{topic_id}")
async def get_topic(topic_id: str, _admin: AuthenticatedUser = Depends(require_admin)) -> dict:
    row = await hl_repo.admin_get_by_id(topic_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.post("/topics", response_model=HealthTopicSummary)
async def create_topic(
    body: HealthTopicCreateInput, _admin: AuthenticatedUser = Depends(require_admin)
) -> HealthTopicSummary:
    row = await hl_repo.admin_create(body.model_dump())
    if not row:
        raise HTTPException(status_code=500, detail="Create failed")
    return _summary(row)


@router.patch("/topics/{topic_id}", response_model=HealthTopicSummary)
async def update_topic(
    topic_id: str,
    body: HealthTopicUpdateInput,
    _admin: AuthenticatedUser = Depends(require_admin),
) -> HealthTopicSummary:
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    row = await hl_repo.admin_update(topic_id, payload)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return _summary(row)


@router.delete("/topics/{topic_id}")
async def delete_topic(
    topic_id: str, _admin: AuthenticatedUser = Depends(require_admin)
) -> dict:
    ok = await hl_repo.admin_delete(topic_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": True}
