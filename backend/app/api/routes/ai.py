"""AI Health Intelligence API — educational assistant only."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.ai.models import (
    AiBloodworkReportRequest,
    AiBloodworkReportResult,
    AiChatRequest,
    AiChatResponse,
    AiCycleReportRequest,
    AiCycleReportResult,
    AiInsightsRequest,
    AiInsightsResult,
    AiTimelineRequest,
    AiTimelineResult,
)
from app.core.auth import AuthenticatedUser, get_current_user
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/bloodwork-report", response_model=AiBloodworkReportResult)
async def bloodwork_report(
    body: AiBloodworkReportRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AiBloodworkReportResult:
    """
    Generate educational bloodwork report from structured data.
    AI explains — does NOT diagnose or calculate risk scores.
    """
    try:
        return await ai_service.generate_bloodwork_report(user.user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc


@router.post("/cycle-report", response_model=AiCycleReportResult)
async def cycle_report(
    body: AiCycleReportRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AiCycleReportResult:
    """Generate educational cycle report explaining rule-based risk scores."""
    try:
        return await ai_service.generate_cycle_report(user.user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc


@router.post("/timeline", response_model=AiTimelineResult)
async def health_timeline(
    body: AiTimelineRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AiTimelineResult:
    """Generate chronological educational health timeline."""
    try:
        return await ai_service.generate_timeline(user.user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc


@router.post("/insights", response_model=AiInsightsResult)
async def health_insights(
    body: AiInsightsRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AiInsightsResult:
    """Generate factual educational insights from trends."""
    try:
        return await ai_service.generate_insights(user.user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc


@router.post("/chat", response_model=AiChatResponse)
async def ai_chat(
    body: AiChatRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AiChatResponse:
    """
    Educational chat — structured context only, no raw prompt passthrough.
    Does not provide medical advice or prescribe compounds.
    """
    try:
        return await ai_service.chat(user.user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc


@router.get("/chat/history")
async def chat_history(
    user: AuthenticatedUser = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
) -> list[dict]:
    """Retrieve recent chat messages for the current user."""
    return await ai_service.get_chat_history(user.user_id, limit)
