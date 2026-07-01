"""AI service Pydantic models — structured JSON in/out only."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


AI_DISCLAIMER = (
    "This information is for educational purposes only. It is not medical advice, "
    "does not diagnose any condition, and does not recommend starting, stopping, "
    "or changing any medication or compound. Always consult a qualified healthcare provider."
)

AiFeature = Literal["bloodwork_report", "cycle_report", "timeline", "insights", "chat"]


class AiSourceReference(BaseModel):
    title: str
    url: str | None = None
    citation_text: str | None = None
    source_type: Literal["article", "knowledge_base", "scientific"] = "article"


class UserProfileContext(BaseModel):
    age: int | None = None
    sex: str | None = None
    training_experience: str | None = None
    goal: str | None = None


class BloodworkMarkerContext(BaseModel):
    marker_name: str
    result_value: float
    unit: str
    reference_low: float | None = None
    reference_high: float | None = None
    status: Literal["Low", "Normal", "High"] | None = None
    category: str | None = None


class BloodworkReportContext(BaseModel):
    report_id: str | None = None
    report_name: str
    collection_date: str | None = None
    lab_name: str | None = None
    markers: list[BloodworkMarkerContext] = Field(default_factory=list)


class BloodworkTrendPoint(BaseModel):
    marker_name: str
    collection_date: str
    result_value: float
    unit: str
    status: str | None = None


class CycleCompoundContext(BaseModel):
    name: str
    weekly_dose: float
    unit: str = "mg"
    duration_weeks: int = 12
    category: str | None = None


class CycleContext(BaseModel):
    cycle_id: str | None = None
    cycle_name: str
    goal: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    compounds: list[CycleCompoundContext] = Field(default_factory=list)


class RiskCategoryContext(BaseModel):
    category_name: str
    score: float
    level: str
    triggered_rule_count: int = 0


class RiskAssessmentContext(BaseModel):
    overall_score: float
    overall_level: str
    categories: list[RiskCategoryContext] = Field(default_factory=list)
    summary: str | None = None


class AiBloodworkReportRequest(BaseModel):
    """Structured context for bloodwork AI report — no raw prompts."""

    profile: UserProfileContext | None = None
    report: BloodworkReportContext
    historical_trends: list[BloodworkTrendPoint] = Field(default_factory=list)
    risk_assessment: RiskAssessmentContext | None = None


class OutOfRangeMarker(BaseModel):
    marker_name: str
    result_value: float
    unit: str
    status: str
    reference_range: str | None = None
    educational_note: str


class AiBloodworkReportResult(BaseModel):
    overview: str
    normal_markers: list[str] = Field(default_factory=list)
    out_of_range_markers: list[OutOfRangeMarker] = Field(default_factory=list)
    historical_comparison: str
    monitoring_considerations: list[str] = Field(default_factory=list)
    related_articles: list[AiSourceReference] = Field(default_factory=list)
    scientific_references: list[AiSourceReference] = Field(default_factory=list)
    disclaimer: str = AI_DISCLAIMER


class AiCycleReportRequest(BaseModel):
    profile: UserProfileContext | None = None
    cycle: CycleContext
    risk_assessment: RiskAssessmentContext
    bloodwork: list[BloodworkMarkerContext] = Field(default_factory=list)


class AiCycleReportResult(BaseModel):
    compound_summary: str
    duration_summary: str
    risk_explanation: str
    relevant_markers: list[str] = Field(default_factory=list)
    monitoring_priorities: list[str] = Field(default_factory=list)
    related_articles: list[AiSourceReference] = Field(default_factory=list)
    scientific_references: list[AiSourceReference] = Field(default_factory=list)
    disclaimer: str = AI_DISCLAIMER


class TimelineEvent(BaseModel):
    date: str
    event_type: str
    title: str
    description: str


class AiTimelineRequest(BaseModel):
    profile: UserProfileContext | None = None
    current_cycle: CycleContext | None = None
    previous_cycles: list[CycleContext] = Field(default_factory=list)
    bloodwork_reports: list[BloodworkReportContext] = Field(default_factory=list)
    risk_history: list[dict[str, Any]] = Field(default_factory=list)


class AiTimelineResult(BaseModel):
    events: list[TimelineEvent] = Field(default_factory=list)
    trend_summaries: list[str] = Field(default_factory=list)
    educational_observations: list[str] = Field(default_factory=list)
    related_articles: list[AiSourceReference] = Field(default_factory=list)
    scientific_references: list[AiSourceReference] = Field(default_factory=list)
    disclaimer: str = AI_DISCLAIMER


class AiInsightItem(BaseModel):
    title: str
    description: str
    marker_name: str | None = None
    trend_direction: Literal["up", "down", "stable", "unknown"] | None = None


class AiInsightsRequest(BaseModel):
    profile: UserProfileContext | None = None
    bloodwork_trends: list[BloodworkTrendPoint] = Field(default_factory=list)
    risk_history: list[dict[str, Any]] = Field(default_factory=list)


class AiInsightsResult(BaseModel):
    insights: list[AiInsightItem] = Field(default_factory=list)
    related_articles: list[AiSourceReference] = Field(default_factory=list)
    scientific_references: list[AiSourceReference] = Field(default_factory=list)
    disclaimer: str = AI_DISCLAIMER


class AiChatRequest(BaseModel):
    """User question — sanitized and templated server-side."""

    message: str = Field(..., min_length=1, max_length=2000)
    context_type: Literal["bloodwork", "cycle", "risk", "general"] = "general"
    profile: UserProfileContext | None = None
    report: BloodworkReportContext | None = None
    cycle: CycleContext | None = None
    risk_assessment: RiskAssessmentContext | None = None
    bloodwork_trends: list[BloodworkTrendPoint] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def strip_message(cls, v: str) -> str:
        return v.strip()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    sources: list[AiSourceReference] = Field(default_factory=list)


class AiChatResponse(BaseModel):
    reply: str
    sources: list[AiSourceReference] = Field(default_factory=list)
    disclaimer: str = AI_DISCLAIMER


class AiGenerationMeta(BaseModel):
    model: str
    tokens_in: int = 0
    tokens_out: int = 0
    latency_ms: int = 0
    used_fallback: bool = False
