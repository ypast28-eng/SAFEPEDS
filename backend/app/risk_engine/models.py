"""Risk Engine input/output models — framework-agnostic."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class UserProfileInput(BaseModel):
    age: int | None = None
    sex: str | None = None
    height: float | None = None
    weight: float | None = None
    body_fat: float | None = None
    training_experience: str | None = None


class CompoundProfileInput(BaseModel):
    liver_toxicity: int | None = None
    kidney_toxicity: int | None = None
    cardiovascular_toxicity: int | None = None
    lipid_impact: int | None = None
    hematocrit_impact: int | None = None
    blood_pressure_impact: int | None = None
    estrogenic_activity: int | None = None
    androgenic_activity: int | None = None
    prolactin_activity: int | None = None


class CycleCompoundInput(BaseModel):
    compound_id: str
    name: str
    category: str | None = None
    compound_type: str | None = None
    administration: str | None = None
    weekly_dose: float
    unit: str = "mg"
    frequency_per_week: int = 1
    duration_weeks: int = 12
    profile: CompoundProfileInput | None = None


class CycleInput(BaseModel):
    cycle_id: str | None = None
    cycle_name: str = "Untitled Cycle"
    goal: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    compounds: list[CycleCompoundInput] = Field(default_factory=list)


class BloodworkMarkerInput(BaseModel):
    marker_name: str
    result_value: float
    unit: str
    status: Literal["Low", "Normal", "High"] | None = None
    collection_date: str | None = None


class RiskRuleConfig(BaseModel):
    """Rule loaded from database configuration."""

    rule_key: str
    category_slug: str
    name: str
    condition: dict[str, Any]
    weight: float
    evidence_placeholder: str | None = None
    explanation: str
    enabled: bool = True


class RiskEngineInput(BaseModel):
    user_profile: UserProfileInput | None = None
    cycle: CycleInput
    bloodwork: list[BloodworkMarkerInput] = Field(default_factory=list)
    goal: str | None = None


class TriggeredRuleOutput(BaseModel):
    rule_key: str
    name: str
    weight_applied: float
    explanation: str
    evidence_placeholder: str | None = None


class CategoryRiskOutput(BaseModel):
    category: str
    category_name: str
    score: float
    level: str
    triggered_rules: list[TriggeredRuleOutput] = Field(default_factory=list)


class RiskAssessmentResult(BaseModel):
    overall_score: float
    overall_level: str
    categories: list[CategoryRiskOutput]
    summary: str
    monitoring_recommendations: list[str] = Field(default_factory=list)
    triggered_rules_count: int = 0
    disclaimer: str = (
        "Educational risk assessment only. Not medical advice. "
        "Does not determine safety or prescribe treatment."
    )


class RiskCompareInput(BaseModel):
    user_profile: UserProfileInput | None = None
    cycle_a: CycleInput
    cycle_b: CycleInput
    bloodwork: list[BloodworkMarkerInput] = Field(default_factory=list)


class CategoryComparisonOutput(BaseModel):
    category: str
    category_name: str
    score_a: float
    level_a: str
    score_b: float
    level_b: str
    score_delta: float


class CompareCyclesResult(BaseModel):
    cycle_a_name: str
    cycle_b_name: str
    assessment_a: RiskAssessmentResult
    assessment_b: RiskAssessmentResult
    category_comparisons: list[CategoryComparisonOutput]
    compound_differences: list[str]
    duration_differences: list[str]
    monitoring_considerations: list[str]
    disclaimer: str


class WhatIfInput(BaseModel):
    user_profile: UserProfileInput | None = None
    base_cycle: CycleInput
    modified_cycle: CycleInput
    bloodwork: list[BloodworkMarkerInput] = Field(default_factory=list)


class WhatIfResult(BaseModel):
    base_assessment: RiskAssessmentResult
    modified_assessment: RiskAssessmentResult
    category_comparisons: list[CategoryComparisonOutput]
    summary: str
    disclaimer: str
