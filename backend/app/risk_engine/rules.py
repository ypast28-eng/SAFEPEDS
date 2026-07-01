"""Modular rule evaluator — each rule type is independent."""

from __future__ import annotations

from typing import Any

from app.risk_engine.models import BloodworkMarkerInput, CycleCompoundInput, RiskEngineInput


class RuleContext:
    """Pre-computed context for efficient rule evaluation."""

    def __init__(self, data: RiskEngineInput) -> None:
        self.data = data
        self.compounds = data.cycle.compounds
        self.bloodwork = data.bloodwork
        self.categories = {c.category for c in self.compounds if c.category}
        self.compound_types = {c.compound_type for c in self.compounds if c.compound_type}
        self.administrations = {c.administration for c in self.compounds if c.administration}
        self.compound_names = [c.name for c in self.compounds]

    def injectable_count(self) -> int:
        return sum(
            1
            for c in self.compounds
            if c.administration in ("intramuscular", "subcutaneous", "intravenous")
        )

    def max_frequency(self) -> int:
        if not self.compounds:
            return 0
        return max(c.frequency_per_week for c in self.compounds)

    def max_duration(self) -> int:
        if not self.compounds:
            return 0
        return max(c.duration_weeks for c in self.compounds)

    def has_category(self, category: str) -> bool:
        return category in self.categories

    def bloodwork_status(self, marker: str, status: str) -> bool:
        for b in self.bloodwork:
            if b.marker_name.lower() == marker.lower() and b.status == status:
                return True
        return False


def evaluate_condition(condition: dict[str, Any], ctx: RuleContext) -> bool:
    """Evaluate a single rule condition JSON object."""
    rule_type = condition.get("type", "always")

    if rule_type == "always":
        return True

    if rule_type == "compound_count_gte":
        return len(ctx.compounds) >= int(condition.get("threshold", 0))

    if rule_type == "injectable_count_gte":
        return ctx.injectable_count() >= int(condition.get("threshold", 0))

    if rule_type == "max_frequency_gte":
        return ctx.max_frequency() >= int(condition.get("threshold", 0))

    if rule_type == "max_duration_gte":
        return ctx.max_duration() >= int(condition.get("threshold", 0))

    if rule_type == "has_administration":
        return condition.get("value") in ctx.administrations

    if rule_type == "has_compound_type":
        return condition.get("value") in ctx.compound_types

    if rule_type == "compound_type_any":
        values = set(condition.get("values", []))
        return bool(ctx.compound_types & values)

    if rule_type == "compound_category_contains":
        return ctx.has_category(condition.get("category", ""))

    if rule_type == "not_has_category":
        return not ctx.has_category(condition.get("category", ""))

    if rule_type == "compound_name_contains":
        substring = condition.get("substring", "")
        return any(substring.lower() in name.lower() for name in ctx.compound_names)

    if rule_type == "compound_profile_gte":
        field = condition.get("field", "")
        threshold = float(condition.get("threshold", 0))
        for compound in ctx.compounds:
            if compound.profile is None:
                continue
            value = getattr(compound.profile, field, None)
            if value is not None and float(value) >= threshold:
                return True
        return False

    if rule_type == "bloodwork_marker_status":
        return ctx.bloodwork_status(
            condition.get("marker", ""),
            condition.get("status", ""),
        )

    if rule_type == "bloodwork_absent":
        return len(ctx.bloodwork) == 0

    # Unknown rule types do not fire (safe default)
    return False


def profile_field_max(compounds: list[CycleCompoundInput], field: str) -> float:
    values = []
    for c in compounds:
        if c.profile is None:
            continue
        v = getattr(c.profile, field, None)
        if v is not None:
            values.append(float(v))
    return max(values) if values else 0.0
