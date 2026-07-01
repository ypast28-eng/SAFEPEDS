"""Tests for Health Support Library RAG."""

from app.health_library.rag import _to_context


def test_to_context_includes_health_library_url() -> None:
    row = {
        "slug": "high-hematocrit",
        "title": "High Hematocrit",
        "category": "Blood Health",
        "summary": "Educational overview.",
        "overview": "Overview text.",
        "why_it_matters": "Why it matters.",
        "blood_markers_involved": ["Hematocrit"],
    }
    ctx = _to_context(row, full=True)
    assert ctx["source_type"] == "health_library"
    assert ctx["url"] == "/health-library/high-hematocrit"
    assert "Hematocrit" in ctx["blood_markers"]
