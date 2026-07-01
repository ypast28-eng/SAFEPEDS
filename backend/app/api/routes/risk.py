"""Risk Engine API endpoints — educational scoring only."""

from fastapi import APIRouter, Query

from app.risk_engine.models import (
    CompareCyclesResult,
    RiskAssessmentResult,
    RiskCompareInput,
    RiskEngineInput,
    WhatIfInput,
    WhatIfResult,
)
from app.services import risk_service

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/calculate", response_model=RiskAssessmentResult)
async def calculate_risk(
    body: RiskEngineInput,
    user_id: str | None = Query(None, description="User ID for history persistence"),
    save: bool = Query(True, description="Save assessment to history"),
) -> RiskAssessmentResult:
    """
    Calculate educational risk scores for a cycle.
    Scores are rule-based — AI does NOT determine values.
    """
    return await risk_service.calculate_risk(body, user_id=user_id, save=save)


@router.post("/compare", response_model=CompareCyclesResult)
async def compare_cycles(
    body: RiskCompareInput,
    user_id: str | None = Query(None),
    save: bool = Query(True),
) -> CompareCyclesResult:
    """Compare educational risk between two cycles."""
    return await risk_service.compare_cycles(body, user_id=user_id, save=save)


@router.post("/what-if", response_model=WhatIfResult)
async def what_if_analysis(
    body: WhatIfInput,
    user_id: str | None = Query(None),
    save: bool = Query(True),
) -> WhatIfResult:
    """What-if analysis: compare base vs modified cycle instantly."""
    return await risk_service.what_if_analysis(body, user_id=user_id, save=save)


@router.get("/history/{user_id}")
async def risk_history(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
) -> list[dict]:
    """Retrieve past risk assessments for a user."""
    return await risk_service.get_risk_history(user_id, limit=limit)
