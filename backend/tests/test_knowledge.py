"""Tests for Knowledge Base search and RAG."""

from app.ai.fallback import generate_bloodwork_report
from app.knowledge.rag import _tokenize


def test_tokenize_removes_stop_words() -> None:
    tokens = _tokenize("What does elevated ALT measure?")
    assert "what" not in tokens
    assert "alt" in tokens or "elevated" in tokens


def test_fallback_uses_article_structure() -> None:
    context = {
        "report": {
            "report_name": "Panel",
            "collection_date": "2025-06-01",
            "markers": [
                {"marker_name": "ALT", "result_value": 50, "unit": "U/L", "status": "High"},
            ],
        },
    }
    articles = [{"slug": "understanding-liver-enzymes", "title": "Liver Enzymes", "summary": "Educational"}]
    result = generate_bloodwork_report(context, articles, [])
    assert result.related_articles[0].title == "Liver Enzymes"
