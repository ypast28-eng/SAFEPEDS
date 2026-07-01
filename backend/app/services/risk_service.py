"""Risk assessment service — wires engine to rule repository."""

from __future__ import annotations

from app.repositories.risk_rules import (
    fetch_assessment_history,
    fetch_enabled_rules,
    save_assessment,
)
from app.risk_engine import RiskEngine
from app.risk_engine.models import (
    CompareCyclesResult,
    RiskAssessmentResult,
    RiskCompareInput,
    RiskEngineInput,
    WhatIfInput,
    WhatIfResult,
)


async def get_engine() -> RiskEngine:
    rules = await fetch_enabled_rules()
    return RiskEngine(rules)


async def calculate_risk(
    data: RiskEngineInput,
    user_id: str | None = None,
    save: bool = True,
) -> RiskAssessmentResult:
    engine = await get_engine()
    result = engine.calculate(data)

    if save and user_id:
        await save_assessment(
            user_id=user_id,
            assessment_type="calculate",
            input_snapshot=data.model_dump(),
            output=result.model_dump(),
            overall_score=result.overall_score,
            cycle_id=data.cycle.cycle_id,
        )

    return result


async def compare_cycles(
    data: RiskCompareInput,
    user_id: str | None = None,
    save: bool = True,
) -> CompareCyclesResult:
    engine = await get_engine()
    result = engine.compare(data)

    if save and user_id:
        await save_assessment(
            user_id=user_id,
            assessment_type="compare",
            input_snapshot=data.model_dump(),
            output=result.model_dump(),
            overall_score=result.assessment_b.overall_score,
        )

    return result


async def what_if_analysis(
    data: WhatIfInput,
    user_id: str | None = None,
    save: bool = True,
) -> WhatIfResult:
    engine = await get_engine()
    result = engine.what_if(data)

    if save and user_id:
        await save_assessment(
            user_id=user_id,
            assessment_type="what_if",
            input_snapshot=data.model_dump(),
            output=result.model_dump(),
            overall_score=result.modified_assessment.overall_score,
            cycle_id=data.modified_cycle.cycle_id,
        )

    return result


async def get_risk_history(user_id: str, limit: int = 20) -> list[dict]:
    return await fetch_assessment_history(user_id, limit)
