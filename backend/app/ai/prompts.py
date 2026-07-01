"""Reusable prompt templates — AI receives templated structured context only."""

from __future__ import annotations

import json
from typing import Any

SYSTEM_PROMPT = """You are an educational health assistant for PED Health AI.

KNOWLEDGE BASE PRIORITY:
1. HEALTH LIBRARY topics are the PRIMARY source — use them first; do not invent content.
2. KNOWLEDGE BASE articles are secondary supporting context.
3. Cite Health Library and Knowledge Base titles when explaining.

STRICT RULES — NEVER VIOLATE:
1. You ONLY explain information already provided in structured JSON context.
2. You NEVER calculate or modify risk scores — they are pre-computed by a rule engine.
3. You NEVER diagnose diseases or medical conditions.
4. You NEVER prescribe medications, compounds, or dosages.
5. You NEVER tell users a cycle is "safe" or "unsafe".
6. You NEVER recommend increasing doses, extending cycles, or starting/stopping compounds.
7. Use factual, educational language. Cite provided articles/references when relevant.
8. Always remind users this is educational, not medical advice.

Respond with valid JSON matching the requested schema exactly."""

BLOODWORK_REPORT_SCHEMA = """{
  "overview": "string — educational summary of the report",
  "normal_markers": ["marker names within reference range"],
  "out_of_range_markers": [{"marker_name": "", "result_value": 0, "unit": "", "status": "Low|High", "reference_range": "", "educational_note": ""}],
  "historical_comparison": "string — compare to prior results if provided",
  "monitoring_considerations": ["educational monitoring placeholders"]
}"""

CYCLE_REPORT_SCHEMA = """{
  "compound_summary": "string",
  "duration_summary": "string",
  "risk_explanation": "string — explain pre-computed risk scores only",
  "relevant_markers": ["marker names to discuss with clinician"],
  "monitoring_priorities": ["educational priorities"]
}"""

TIMELINE_SCHEMA = """{
  "events": [{"date": "ISO date", "event_type": "cycle|bloodwork|risk", "title": "", "description": ""}],
  "trend_summaries": ["string"],
  "educational_observations": ["string"]
}"""

INSIGHTS_SCHEMA = """{
  "insights": [{"title": "", "description": "", "marker_name": null, "trend_direction": "up|down|stable|unknown"}]
}"""

CHAT_SCHEMA = """{
  "reply": "string — educational answer only",
}"""


def build_bloodwork_prompt(
    context: dict[str, Any], health_topics: list[dict], articles: list[dict]
) -> str:
    return f"""Generate an educational bloodwork report from this structured data.
Do NOT invent content — use Health Library and Knowledge Base sources below.

CONTEXT:
{json.dumps(context, indent=2)}

HEALTH LIBRARY (PRIMARY — use first):
{json.dumps(health_topics, indent=2)}

KNOWLEDGE BASE ARTICLES (secondary):
{json.dumps(articles, indent=2)}

Return JSON matching this schema:
{BLOODWORK_REPORT_SCHEMA}"""


def build_cycle_prompt(
    context: dict[str, Any], health_topics: list[dict], articles: list[dict]
) -> str:
    return f"""Generate an educational cycle report. Explain PRE-COMPUTED risk scores only.

CONTEXT:
{json.dumps(context, indent=2)}

HEALTH LIBRARY (PRIMARY):
{json.dumps(health_topics, indent=2)}

KNOWLEDGE BASE:
{json.dumps(articles, indent=2)}

Return JSON matching this schema:
{CYCLE_REPORT_SCHEMA}"""


def build_timeline_prompt(
    context: dict[str, Any], health_topics: list[dict], articles: list[dict]
) -> str:
    return f"""Generate a chronological educational health timeline from structured data.
Use Health Library topics as primary educational context — do not invent content.

CONTEXT:
{json.dumps(context, indent=2)}

HEALTH LIBRARY (PRIMARY):
{json.dumps(health_topics, indent=2)}

KNOWLEDGE BASE:
{json.dumps(articles, indent=2)}

Return JSON matching this schema:
{TIMELINE_SCHEMA}"""


def build_insights_prompt(
    context: dict[str, Any], health_topics: list[dict], articles: list[dict]
) -> str:
    return f"""Generate factual educational insights from bloodwork trends. No diagnostic conclusions.
Use Health Library topics as primary educational context — do not invent content.

CONTEXT:
{json.dumps(context, indent=2)}

HEALTH LIBRARY (PRIMARY):
{json.dumps(health_topics, indent=2)}

KNOWLEDGE BASE:
{json.dumps(articles, indent=2)}

Return JSON matching this schema:
{INSIGHTS_SCHEMA}"""


def build_chat_prompt(
    user_message: str,
    context: dict[str, Any],
    health_topics: list[dict],
    articles: list[dict],
    memory: list[dict],
) -> str:
    return f"""Answer this educational question using ONLY the provided context.
Prioritize Health Library content. Do NOT invent educational content.

USER QUESTION:
{user_message}

STRUCTURED CONTEXT:
{json.dumps(context, indent=2)}

HEALTH LIBRARY (PRIMARY):
{json.dumps(health_topics, indent=2)}

KNOWLEDGE BASE:
{json.dumps(articles, indent=2)}

USER MEMORY:
{json.dumps(memory, indent=2)}

Return JSON matching this schema:
{CHAT_SCHEMA}"""
