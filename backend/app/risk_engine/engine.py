"""Risk Engine orchestrator — deterministic, transparent scoring."""

from __future__ import annotations

from collections import defaultdict

from app.risk_engine.models import (
    CategoryComparisonOutput,
    CategoryRiskOutput,
    CompareCyclesResult,
    CycleCompoundInput,
    RiskAssessmentResult,
    RiskCompareInput,
    RiskEngineInput,
    RiskRuleConfig,
    TriggeredRuleOutput,
    WhatIfInput,
    WhatIfResult,
)
from app.risk_engine.rules import RuleContext, evaluate_condition
from app.risk_engine.scoring import score_to_level

CATEGORY_DISPLAY_NAMES: dict[str, str] = {
    "liver": "Liver",
    "kidney": "Kidney",
    "cardiovascular": "Cardiovascular",
    "blood_pressure": "Blood Pressure",
    "lipids": "Lipids",
    "hematocrit": "Hematocrit",
    "hormonal_suppression": "Hormonal Suppression",
    "estrogen": "Estrogen",
    "prolactin": "Prolactin",
    "sleep": "Sleep",
    "mental_wellbeing": "Mental Wellbeing",
    "fertility": "Fertility",
    "injection_burden": "Injection Burden",
    "overall_monitoring_priority": "Overall Monitoring Priority",
}

MONITORING_PLACEHOLDERS: dict[str, str] = {
    "liver": "Consider periodic liver enzyme panels per your clinician.",
    "kidney": "Monitor renal markers per your supplied lab reference ranges.",
    "cardiovascular": "Track cardiovascular markers and blood pressure regularly.",
    "blood_pressure": "Self-monitor blood pressure; log readings over time.",
    "lipids": "Repeat lipid panels at intervals appropriate to your protocol.",
    "hematocrit": "Track hematocrit/CBC markers on your logged schedule.",
    "hormonal_suppression": "Hormone panels may be relevant — educational tracking only.",
    "estrogen": "Estradiol tracking may be relevant depending on stack composition.",
    "prolactin": "Prolactin monitoring placeholder — consult literature and clinician.",
    "sleep": "Track sleep quality subjectively alongside protocol changes.",
    "mental_wellbeing": "Monitor mood and wellbeing; seek support if needed.",
    "fertility": "Reproductive health awareness; educational monitoring only.",
    "injection_burden": "Review injection frequency and rotation practices.",
    "overall_monitoring_priority": "Increase overall monitoring frequency for complex stacks.",
}


class RiskEngine:
    """
    Pure risk calculation engine.
    Receives structured inputs and rule configuration; returns scores only.
    AI must NOT call this to override scores — it explains outputs later.
    """

    def __init__(self, rules: list[RiskRuleConfig]) -> None:
        self.rules = [r for r in rules if r.enabled]

    def calculate(self, data: RiskEngineInput) -> RiskAssessmentResult:
        ctx = RuleContext(data)
        category_scores: dict[str, float] = defaultdict(float)
        category_rules: dict[str, list[TriggeredRuleOutput]] = defaultdict(list)
        total_triggered = 0

        for rule in self.rules:
            if not evaluate_condition(rule.condition, ctx):
                continue

            category_scores[rule.category_slug] += rule.weight
            category_rules[rule.category_slug].append(
                TriggeredRuleOutput(
                    rule_key=rule.rule_key,
                    name=rule.name,
                    weight_applied=rule.weight,
                    explanation=rule.explanation,
                    evidence_placeholder=rule.evidence_placeholder,
                )
            )
            total_triggered += 1

        categories: list[CategoryRiskOutput] = []
        monitoring: list[str] = []

        all_slugs = set(CATEGORY_DISPLAY_NAMES.keys()) | set(category_scores.keys())

        for slug in sorted(all_slugs, key=lambda s: CATEGORY_DISPLAY_NAMES.get(s, s)):
            raw_score = min(100.0, category_scores.get(slug, 0.0))
            level = score_to_level(raw_score)
            triggered = category_rules.get(slug, [])

            categories.append(
                CategoryRiskOutput(
                    category=slug,
                    category_name=CATEGORY_DISPLAY_NAMES.get(slug, slug.replace("_", " ").title()),
                    score=round(raw_score, 1),
                    level=level,
                    triggered_rules=triggered,
                )
            )

            if level in ("Moderate", "High", "Very High") and slug in MONITORING_PLACEHOLDERS:
                monitoring.append(MONITORING_PLACEHOLDERS[slug])

        overall_score = round(
            sum(c.score for c in categories) / len(categories) if categories else 0.0,
            1,
        )
        overall_level = score_to_level(overall_score)

        compound_count = len(data.cycle.compounds)
        summary = (
            f"Educational assessment for '{data.cycle.cycle_name}' with {compound_count} "
            f"compound(s). Overall monitoring priority: {overall_level} ({overall_score}/100). "
            f"{total_triggered} rule(s) triggered. Placeholder scoring — not a safety determination."
        )

        return RiskAssessmentResult(
            overall_score=overall_score,
            overall_level=overall_level,
            categories=categories,
            summary=summary,
            monitoring_recommendations=monitoring[:6],
            triggered_rules_count=total_triggered,
        )

    def compare(self, data: RiskCompareInput) -> CompareCyclesResult:
        assessment_a = self.calculate(
            RiskEngineInput(
                user_profile=data.user_profile,
                cycle=data.cycle_a,
                bloodwork=data.bloodwork,
                goal=data.cycle_a.goal,
            )
        )
        assessment_b = self.calculate(
            RiskEngineInput(
                user_profile=data.user_profile,
                cycle=data.cycle_b,
                bloodwork=data.bloodwork,
                goal=data.cycle_b.goal,
            )
        )

        comparisons: list[CategoryComparisonOutput] = []
        map_a = {c.category: c for c in assessment_a.categories}
        map_b = {c.category: c for c in assessment_b.categories}
        all_cats = set(map_a.keys()) | set(map_b.keys())

        for cat in sorted(all_cats):
            ca = map_a.get(cat)
            cb = map_b.get(cat)
            score_a = ca.score if ca else 0.0
            score_b = cb.score if cb else 0.0
            comparisons.append(
                CategoryComparisonOutput(
                    category=cat,
                    category_name=CATEGORY_DISPLAY_NAMES.get(cat, cat),
                    score_a=score_a,
                    level_a=ca.level if ca else "Very Low",
                    score_b=score_b,
                    level_b=cb.level if cb else "Very Low",
                    score_delta=round(score_b - score_a, 1),
                )
            )

        compound_diffs = self._compound_differences(data.cycle_a.compounds, data.cycle_b.compounds)
        duration_diffs = self._duration_differences(data.cycle_a.compounds, data.cycle_b.compounds)

        monitoring = []
        for comp in comparisons:
            if abs(comp.score_delta) >= 10:
                direction = "higher" if comp.score_delta > 0 else "lower"
                monitoring.append(
                    f"{comp.category_name}: {direction} educational score in cycle B "
                    f"({comp.score_delta:+.1f} points)."
                )

        return CompareCyclesResult(
            cycle_a_name=data.cycle_a.cycle_name,
            cycle_b_name=data.cycle_b.cycle_name,
            assessment_a=assessment_a,
            assessment_b=assessment_b,
            category_comparisons=comparisons,
            compound_differences=compound_diffs,
            duration_differences=duration_diffs,
            monitoring_considerations=monitoring[:8],
            disclaimer=assessment_a.disclaimer,
        )

    def what_if(self, data: WhatIfInput) -> WhatIfResult:
        base = self.calculate(
            RiskEngineInput(
                user_profile=data.user_profile,
                cycle=data.base_cycle,
                bloodwork=data.bloodwork,
            )
        )
        modified = self.calculate(
            RiskEngineInput(
                user_profile=data.user_profile,
                cycle=data.modified_cycle,
                bloodwork=data.bloodwork,
            )
        )

        comparisons: list[CategoryComparisonOutput] = []
        map_base = {c.category: c for c in base.categories}
        map_mod = {c.category: c for c in modified.categories}

        for cat in sorted(set(map_base.keys()) | set(map_mod.keys())):
            ca = map_base.get(cat)
            cb = map_mod.get(cat)
            score_a = ca.score if ca else 0.0
            score_b = cb.score if cb else 0.0
            comparisons.append(
                CategoryComparisonOutput(
                    category=cat,
                    category_name=CATEGORY_DISPLAY_NAMES.get(cat, cat),
                    score_a=score_a,
                    level_a=ca.level if ca else "Very Low",
                    score_b=score_b,
                    level_b=cb.level if cb else "Very Low",
                    score_delta=round(score_b - score_a, 1),
                )
            )

        delta = modified.overall_score - base.overall_score
        summary = (
            f"What-if analysis: overall score change {delta:+.1f} points "
            f"({base.overall_level} → {modified.overall_level}). Educational only."
        )

        return WhatIfResult(
            base_assessment=base,
            modified_assessment=modified,
            category_comparisons=comparisons,
            summary=summary,
            disclaimer=base.disclaimer,
        )

    @staticmethod
    def _compound_differences(
        a: list[CycleCompoundInput], b: list[CycleCompoundInput]
    ) -> list[str]:
        names_a = {c.name for c in a}
        names_b = {c.name for c in b}
        added = names_b - names_a
        removed = names_a - names_b
        diffs: list[str] = []
        for n in sorted(added):
            diffs.append(f"Added in cycle B: {n}")
        for n in sorted(removed):
            diffs.append(f"Removed in cycle B: {n}")
        for ca in a:
            for cb in b:
                if ca.name == cb.name and ca.weekly_dose != cb.weekly_dose:
                    diffs.append(
                        f"{ca.name}: dose {ca.weekly_dose}{ca.unit}/wk → "
                        f"{cb.weekly_dose}{cb.unit}/wk"
                    )
        return diffs[:12]

    @staticmethod
    def _duration_differences(
        a: list[CycleCompoundInput], b: list[CycleCompoundInput]
    ) -> list[str]:
        diffs: list[str] = []
        map_a = {c.name: c for c in a}
        for cb in b:
            if cb.name in map_a and map_a[cb.name].duration_weeks != cb.duration_weeks:
                ca = map_a[cb.name]
                diffs.append(
                    f"{cb.name}: duration {ca.duration_weeks}wk → {cb.duration_weeks}wk"
                )
        return diffs[:8]
