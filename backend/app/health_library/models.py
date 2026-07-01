"""Health Support Library models."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

SupportOptionType = Literal[
    "Lifestyle",
    "Monitoring",
    "Nutrition",
    "Supplement",
    "Medication Information",
    "Educational",
]


class ScientificRef(BaseModel):
    title: str
    url: str | None = None
    authors: str | None = None
    journal: str | None = None


class SupportDetailOutput(BaseModel):
    id: str
    description: str
    scientific_references: list[ScientificRef] = Field(default_factory=list)
    notes: str | None = None


class SupportOptionOutput(BaseModel):
    id: str
    title: str
    type: SupportOptionType
    details: list[SupportDetailOutput] = Field(default_factory=list)


class RelatedBloodMarker(BaseModel):
    id: str
    name: str
    category: str | None = None


class RelatedCompound(BaseModel):
    id: str
    name: str
    compound_type: str | None = None


class RelatedKnowledgeArticle(BaseModel):
    id: str
    title: str
    slug: str
    summary: str | None = None


class HealthTopicSummary(BaseModel):
    id: str
    title: str
    slug: str
    category: str
    summary: str | None = None
    view_count: int = 0
    published: bool = True
    image_url: str | None = None
    blood_markers_involved: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str


class HealthTopicDetail(HealthTopicSummary):
    content: str
    overview: str | None = None
    why_it_matters: str | None = None
    support_options: list[SupportOptionOutput] = Field(default_factory=list)
    related_blood_markers: list[RelatedBloodMarker] = Field(default_factory=list)
    related_compounds: list[RelatedCompound] = Field(default_factory=list)
    related_knowledge_articles: list[RelatedKnowledgeArticle] = Field(default_factory=list)
    related_topics: list[HealthTopicSummary] = Field(default_factory=list)


class HealthTopicSearchRequest(BaseModel):
    query: str | None = None
    category: str | None = None
    blood_marker: str | None = None
    limit: int = Field(default=24, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class HealthTopicSearchResult(BaseModel):
    topics: list[HealthTopicSummary]
    total: int
    categories: list[str] = Field(default_factory=list)


class HealthTopicCreateInput(BaseModel):
    title: str
    slug: str
    category: str
    summary: str | None = None
    content: str = ""
    overview: str | None = None
    why_it_matters: str | None = None
    blood_markers_involved: list[str] = Field(default_factory=list)
    image_url: str | None = None
    published: bool = False


class HealthTopicUpdateInput(BaseModel):
    title: str | None = None
    slug: str | None = None
    category: str | None = None
    summary: str | None = None
    content: str | None = None
    overview: str | None = None
    why_it_matters: str | None = None
    blood_markers_involved: list[str] | None = None
    image_url: str | None = None
    published: bool | None = None
