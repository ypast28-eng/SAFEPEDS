"""Unit tests for the Risk Engine — deterministic rule-based scoring."""

from app.risk_engine import RiskEngine
from app.risk_engine.models import (
    CycleCompoundInput,
    CycleInput,
    RiskEngineInput,
    RiskRuleConfig,
)


def _minimal_rules() -> list[RiskRuleConfig]:
    return [
        RiskRuleConfig(
            rule_key="liver_base",
            category_slug="liver",
            name="Base liver monitoring",
            condition={"type": "always"},
            weight=15,
            explanation="Baseline hepatic monitoring consideration.",
            evidence_placeholder="Placeholder",
        ),
        RiskRuleConfig(
            rule_key="overall_base",
            category_slug="overall_monitoring_priority",
            name="Base monitoring priority",
            condition={"type": "always"},
            weight=20,
            explanation="Baseline overall monitoring priority.",
        ),
        RiskRuleConfig(
            rule_key="compound_count",
            category_slug="overall_monitoring_priority",
            name="Compound stack size",
            condition={"type": "compound_count_gte", "threshold": 2},
            weight=10,
            explanation="Multiple compounds increase monitoring complexity.",
        ),
    ]


def test_calculate_returns_all_categories() -> None:
    engine = RiskEngine(_minimal_rules())
    result = engine.calculate(
        RiskEngineInput(
            cycle=CycleInput(
                cycle_name="Test Cycle",
                compounds=[
                    CycleCompoundInput(compound_id="a", name="Compound A", weekly_dose=100),
                    CycleCompoundInput(compound_id="b", name="Compound B", weekly_dose=50),
                ],
            )
        )
    )

    assert 0 <= result.overall_score <= 100
    assert result.overall_level in ("Very Low", "Low", "Moderate", "High", "Very High")
    assert len(result.categories) == 14
    assert result.triggered_rules_count >= 2
    assert "Educational" in result.disclaimer or "educational" in result.summary.lower()


def test_compare_cycles_produces_deltas() -> None:
    from app.risk_engine.models import RiskCompareInput

    engine = RiskEngine(_minimal_rules())
    result = engine.compare(
        RiskCompareInput(
            cycle_a=CycleInput(
                cycle_name="Cycle A",
                compounds=[
                    CycleCompoundInput(compound_id="a", name="A", weekly_dose=100),
                ],
            ),
            cycle_b=CycleInput(
                cycle_name="Cycle B",
                compounds=[
                    CycleCompoundInput(compound_id="a", name="A", weekly_dose=100),
                    CycleCompoundInput(compound_id="b", name="B", weekly_dose=200),
                ],
            ),
        )
    )

    assert result.cycle_a_name == "Cycle A"
    assert result.cycle_b_name == "Cycle B"
    assert len(result.compound_differences) >= 1
    assert result.assessment_b.overall_score >= result.assessment_a.overall_score
