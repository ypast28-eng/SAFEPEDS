"""Deterministic fallback reports when OpenAI is unavailable."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.ai.models import (
    AI_DISCLAIMER,
    AiBloodworkReportResult,
    AiChatResponse,
    AiCycleReportResult,
    AiInsightItem,
    AiInsightsResult,
    AiSourceReference,
    AiTimelineResult,
    OutOfRangeMarker,
    TimelineEvent,
)


def _refs(articles: list[dict]) -> list[AiSourceReference]:
    return [
        AiSourceReference(
            title=a.get("title", ""),
            url=a.get("url"),
            citation_text=a.get("citation_text"),
            source_type="article",
        )
        for a in articles[:5]
    ]


def _sci_refs(references: list[dict]) -> list[AiSourceReference]:
    return [
        AiSourceReference(
            title=r.get("title", ""),
            url=r.get("url"),
            citation_text=r.get("citation_text"),
            source_type="scientific",
        )
        for r in references[:5]
    ]


def generate_bloodwork_report(
    context: dict[str, Any],
    articles: list[dict],
    references: list[dict],
) -> AiBloodworkReportResult:
    report = context.get("report", {})
    markers = report.get("markers", [])
    normal = [m["marker_name"] for m in markers if m.get("status") == "Normal"]
    out_of_range: list[OutOfRangeMarker] = []

    for m in markers:
        status = m.get("status")
        if status in ("Low", "High"):
            ref = ""
            if m.get("reference_low") is not None and m.get("reference_high") is not None:
                ref = f"{m['reference_low']}–{m['reference_high']} {m.get('unit', '')}"
            out_of_range.append(
                OutOfRangeMarker(
                    marker_name=m["marker_name"],
                    result_value=m["result_value"],
                    unit=m.get("unit", ""),
                    status=status,
                    reference_range=ref or None,
                    educational_note=(
                        f"{m['marker_name']} is {status.lower()} relative to your supplied "
                        "laboratory reference range. This is not a diagnosis — discuss with "
                        "your healthcare provider using the ranges on your lab report."
                    ),
                )
            )

    trends = context.get("historical_trends", [])
    hist = (
        f"This report contains {len(markers)} marker(s). "
        f"{len(normal)} within your supplied reference range, {len(out_of_range)} outside range."
    )
    if trends:
        hist += f" Historical trend data includes {len(trends)} prior data point(s) for comparison."

    monitoring = []
    if out_of_range:
        monitoring.append(
            "Markers outside your supplied reference range may warrant discussion with a clinician."
        )
    monitoring.append("Continue logging bloodwork at regular intervals for trend analysis.")

    return AiBloodworkReportResult(
        overview=(
            f"Educational overview of '{report.get('report_name', 'Bloodwork Report')}' "
            f"collected on {report.get('collection_date', 'unknown date')}. "
            "Status labels are based solely on reference ranges you provided."
        ),
        normal_markers=normal,
        out_of_range_markers=out_of_range,
        historical_comparison=hist,
        monitoring_considerations=monitoring,
        related_articles=_refs(articles),
        scientific_references=_sci_refs(references),
        disclaimer=AI_DISCLAIMER,
    )


def generate_cycle_report(
    context: dict[str, Any],
    articles: list[dict],
    references: list[dict],
) -> AiCycleReportResult:
    cycle = context.get("cycle", {})
    compounds = cycle.get("compounds", [])
    risk = context.get("risk_assessment", {})

    compound_lines = [
        f"{c.get('name')}: {c.get('weekly_dose')}{c.get('unit', 'mg')}/wk for {c.get('duration_weeks', 12)} weeks"
        for c in compounds
    ]
    max_weeks = max((c.get("duration_weeks", 12) for c in compounds), default=0)

    risk_cats = risk.get("categories", [])
    high_cats = [c for c in risk_cats if c.get("level") in ("Moderate", "High", "Very High")]

    risk_expl = (
        f"The rule-based engine assigned an overall monitoring priority of "
        f"{risk.get('overall_level', 'N/A')} ({risk.get('overall_score', 0)}/100). "
    )
    if high_cats:
        names = ", ".join(c["category_name"] for c in high_cats[:4])
        risk_expl += f"Elevated educational scores appear in: {names}. "
    risk_expl += "These scores are placeholders — they do not determine safety."

    markers = []
    for c in compounds:
        cat = (c.get("category") or "").lower()
        if "oral" in cat or "17" in c.get("name", "").lower():
            markers.extend(["ALT", "AST"])
        if "testosterone" in c.get("name", "").lower() or "androgen" in cat:
            markers.extend(["Hematocrit", "HDL"])
    markers = list(dict.fromkeys(markers))[:6]

    priorities = [
        "Track bloodwork at intervals appropriate to your protocol.",
        "Monitor subjective markers: sleep, mood, and wellbeing.",
    ]
    if high_cats:
        priorities.insert(0, f"Increased educational monitoring priority in: {high_cats[0]['category_name']}.")

    return AiCycleReportResult(
        compound_summary="; ".join(compound_lines) if compound_lines else "No compounds in cycle.",
        duration_summary=f"Cycle '{cycle.get('cycle_name')}' — longest compound duration: {max_weeks} weeks.",
        risk_explanation=risk_expl,
        relevant_markers=markers,
        monitoring_priorities=priorities,
        related_articles=_refs(articles),
        scientific_references=_sci_refs(references),
        disclaimer=AI_DISCLAIMER,
    )


def generate_timeline(
    context: dict[str, Any],
    articles: list[dict],
    references: list[dict],
) -> AiTimelineResult:
    events: list[TimelineEvent] = []

    for cycle in context.get("previous_cycles", []) + (
        [context["current_cycle"]] if context.get("current_cycle") else []
    ):
        events.append(
            TimelineEvent(
                date=cycle.get("start_date") or "Unknown",
                event_type="cycle",
                title=cycle.get("cycle_name", "Cycle"),
                description=f"{len(cycle.get('compounds', []))} compound(s). Goal: {cycle.get('goal') or 'Not specified'}.",
            )
        )

    for report in context.get("bloodwork_reports", []):
        oor = sum(1 for m in report.get("markers", []) if m.get("status") in ("Low", "High"))
        events.append(
            TimelineEvent(
                date=report.get("collection_date") or "Unknown",
                event_type="bloodwork",
                title=report.get("report_name", "Bloodwork"),
                description=f"{len(report.get('markers', []))} markers, {oor} outside reference range.",
            )
        )

    for rh in context.get("risk_history", [])[:5]:
        events.append(
            TimelineEvent(
                date=rh.get("created_at", "Unknown")[:10],
                event_type="risk",
                title=f"Risk Assessment ({rh.get('assessment_type', 'calculate')})",
                description=f"Overall score: {rh.get('overall_score', 'N/A')}",
            )
        )

    events.sort(key=lambda e: e.date, reverse=True)

    return AiTimelineResult(
        events=events[:20],
        trend_summaries=["Chronological view of cycles, bloodwork, and risk assessments."],
        educational_observations=[
            "Review trends over time rather than isolated data points.",
            "Educational risk scores reflect rule triggers — not clinical diagnoses.",
        ],
        related_articles=_refs(articles),
        scientific_references=_sci_refs(references),
        disclaimer=AI_DISCLAIMER,
    )


def generate_insights(
    context: dict[str, Any],
    articles: list[dict],
    references: list[dict],
) -> AiInsightsResult:
    trends = context.get("bloodwork_trends", [])
    by_marker: dict[str, list] = defaultdict(list)
    for t in trends:
        by_marker[t["marker_name"]].append(t)

    insights: list[AiInsightItem] = []
    for marker, points in by_marker.items():
        if len(points) < 2:
            continue
        points_sorted = sorted(points, key=lambda p: p.get("collection_date", ""))
        first, last = points_sorted[0], points_sorted[-1]
        delta = last["result_value"] - first["result_value"]
        direction = "stable"
        if abs(delta) > 0.01:
            direction = "up" if delta > 0 else "down"

        if direction != "stable":
            insights.append(
                AiInsightItem(
                    title=f"{marker} has trended {direction} over {len(points)} readings",
                    description=(
                        f"{marker} changed from {first['result_value']} to {last['result_value']} "
                        f"{last.get('unit', '')} between {first.get('collection_date', '?')} and "
                        f"{last.get('collection_date', '?')}. Educational observation only."
                    ),
                    marker_name=marker,
                    trend_direction=direction,
                )
            )

        high_count = sum(1 for p in points if p.get("status") == "High")
        if high_count >= 2:
            insights.append(
                AiInsightItem(
                    title=f"{marker} above reference range in consecutive reports",
                    description=(
                        f"{marker} was High in {high_count} of {len(points)} logged results "
                        "relative to your supplied reference ranges."
                    ),
                    marker_name=marker,
                    trend_direction="up",
                )
            )

    if not insights:
        insights.append(
            AiInsightItem(
                title="Insufficient trend data",
                description="Log more bloodwork over time to generate trend-based educational insights.",
                trend_direction="unknown",
            )
        )

    return AiInsightsResult(
        insights=insights[:10],
        related_articles=_refs(articles),
        scientific_references=_sci_refs(references),
        disclaimer=AI_DISCLAIMER,
    )


def generate_chat_reply(
    user_message: str,
    context: dict[str, Any],
    articles: list[dict],
    references: list[dict],
) -> AiChatResponse:
    lower = user_message.lower()
    reply = ""

    if "hdl" in lower:
        reply = (
            "HDL (high-density lipoprotein) cholesterol is an educational lipid marker "
            "commonly tracked in performance health monitoring. Lower HDL over multiple "
            "tests may be worth discussing with your healthcare provider using your lab's "
            "reference ranges. I cannot provide individualized medical advice."
        )
    elif "alt" in lower or "liver" in lower:
        reply = (
            "ALT (alanine aminotransferase) is a liver enzyme measured in blood panels. "
            "Elevated ALT relative to your supplied reference range indicates the value is "
            "outside the range you entered — not a diagnosis. Liver enzymes are commonly "
            "monitored in educational harm-reduction contexts."
        )
    elif "hematocrit" in lower:
        reply = (
            "Hematocrit measures the percentage of red blood cells in blood volume. "
            "It is commonly monitored because certain compounds may influence red blood "
            "cell production. Values above your supplied reference range should be discussed "
            "with a qualified healthcare provider."
        )
    elif "risk" in lower or "score" in lower:
        risk = context.get("risk_assessment", {})
        reply = (
            f"Your rule-based risk assessment shows an overall monitoring priority of "
            f"{risk.get('overall_level', 'N/A')} ({risk.get('overall_score', 0)}/100). "
            "These scores are calculated by transparent rules — not by AI — and do not "
            "determine whether a cycle is safe."
        )
    elif "blood" in lower or "test" in lower or "changed" in lower:
        report = context.get("report", {})
        markers = report.get("markers", [])
        oor = [m for m in markers if m.get("status") in ("Low", "High")]
        reply = (
            f"Your most recent report '{report.get('report_name', '')}' has "
            f"{len(markers)} markers, {len(oor)} outside your supplied reference range. "
            "Compare specific markers on the Trends page for historical context."
        )
    else:
        reply = (
            "I can provide educational explanations about your logged bloodwork, cycle "
            "composition, and rule-based risk scores. I cannot diagnose conditions, "
            "prescribe treatments, or advise on compound use. What specific marker or "
            "topic would you like explained?"
        )

    sources = _refs(articles) + _sci_refs(references)
    return AiChatResponse(reply=reply, sources=sources[:6], disclaimer=AI_DISCLAIMER)
