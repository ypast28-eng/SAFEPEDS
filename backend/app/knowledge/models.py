"""Knowledge Base Pydantic models."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


DifficultyLevel = Literal["beginner", "intermediate", "advanced"]
SortOption = Literal["newest", "popular", "updated"]


class KnowledgeCategory(BaseModel):
    id: str
    slug: str
    name: str
    description: str | None = None


class KnowledgeReference(BaseModel):
    id: str
    title: str
    authors: str | None = None
    journal: str | None = None
    publication_year: int | None = None
    doi: str | None = None
    url: str | None = None


class RelatedCompound(BaseModel):
    id: str
    name: str
    compound_type: str | None = None


class RelatedBloodMarker(BaseModel):
    id: str
    name: str
    category: str | None = None


class ArticleSummary(BaseModel):
    id: str
    title: str
    slug: str
    summary: str | None = None
    difficulty_level: DifficultyLevel
    view_count: int = 0
    published: bool = True
    image_url: str | None = None
    category: KnowledgeCategory
    created_at: str
    updated_at: str


class ArticleDetail(ArticleSummary):
    content: str
    references: list[KnowledgeReference] = Field(default_factory=list)
    related_compounds: list[RelatedCompound] = Field(default_factory=list)
    related_blood_markers: list[RelatedBloodMarker] = Field(default_factory=list)
    related_articles: list[ArticleSummary] = Field(default_factory=list)


class KnowledgeSearchRequest(BaseModel):
    query: str | None = None
    category_slug: str | None = None
    difficulty: DifficultyLevel | None = None
    compound: str | None = None
    blood_marker: str | None = None
    peptide: str | None = None
    sarm: str | None = None
    sort: SortOption = "newest"
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

    @field_validator("query", "compound", "blood_marker", "peptide", "sarm")
    @classmethod
    def strip_optional(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        return s if s else None


class KnowledgeSearchResult(BaseModel):
    articles: list[ArticleSummary]
    total: int
    query: str | None = None


class FeaturedArticles(BaseModel):
    newest: list[ArticleSummary]
    popular: list[ArticleSummary]
    recently_updated: list[ArticleSummary]


class ArticleCreateInput(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    slug: str = Field(..., min_length=3, max_length=200)
    category_id: str
    summary: str | None = None
    content: str = ""
    difficulty_level: DifficultyLevel = "beginner"
    image_url: str | None = None
    published: bool = False


class ArticleUpdateInput(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=300)
    slug: str | None = Field(None, min_length=3, max_length=200)
    category_id: str | None = None
    summary: str | None = None
    content: str | None = None
    difficulty_level: DifficultyLevel | None = None
    image_url: str | None = None
    published: bool | None = None


class ReferenceCreateInput(BaseModel):
    article_id: str
    title: str
    authors: str | None = None
    journal: str | None = None
    publication_year: int | None = None
    doi: str | None = None
    url: str | None = None


class LinkCompoundInput(BaseModel):
    compound_id: str
    article_id: str


class LinkBloodMarkerInput(BaseModel):
    blood_marker_id: str
    article_id: str
