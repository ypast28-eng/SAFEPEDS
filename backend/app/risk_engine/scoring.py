"""Risk level mapping — transparent, deterministic."""

from typing import Literal

RiskLevel = Literal["Very Low", "Low", "Moderate", "High", "Very High"]

LEVEL_THRESHOLDS: list[tuple[int, RiskLevel]] = [
    (80, "Very High"),
    (60, "High"),
    (40, "Moderate"),
    (20, "Low"),
    (0, "Very Low"),
]


def score_to_level(score: float) -> RiskLevel:
    """Map 0–100 score to educational risk level."""
    clamped = max(0.0, min(100.0, score))
    for threshold, level in LEVEL_THRESHOLDS:
        if clamped >= threshold:
            return level
    return "Very Low"


def level_color_hint(level: RiskLevel) -> str:
    """UI hint token (not used by engine logic)."""
    return {
        "Very Low": "success",
        "Low": "info",
        "Moderate": "warning",
        "High": "danger",
        "Very High": "danger",
    }[level]
