"""Fetch risk rules from Supabase REST API with in-memory fallback."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.risk_engine.models import RiskRuleConfig

logger = logging.getLogger(__name__)

# Minimal fallback rules when Supabase is not configured (dev/CI)
FALLBACK_RULES: list[dict[str, Any]] = [
    {
        "rule_key": "liver_base",
        "category_slug": "liver",
        "name": "Base liver monitoring",
        "condition": {"type": "always"},
        "weight": 15,
        "evidence_placeholder": "Placeholder",
        "explanation": "Baseline hepatic monitoring consideration.",
        "enabled": True,
    },
    {
        "rule_key": "overall_base",
        "category_slug": "overall_monitoring_priority",
        "name": "Base monitoring priority",
        "condition": {"type": "always"},
        "weight": 20,
        "evidence_placeholder": "Placeholder",
        "explanation": "Baseline overall monitoring priority.",
        "enabled": True,
    },
    {
        "rule_key": "compound_count",
        "category_slug": "overall_monitoring_priority",
        "name": "Compound stack size",
        "condition": {"type": "compound_count_gte", "threshold": 2},
        "weight": 10,
        "evidence_placeholder": "Placeholder",
        "explanation": "Multiple compounds increase monitoring complexity.",
        "enabled": True,
    },
]


async def fetch_enabled_rules() -> list[RiskRuleConfig]:
    """Load enabled rules from Supabase or return fallback set."""
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase not configured — using fallback risk rules")
        return [RiskRuleConfig(**r) for r in FALLBACK_RULES]

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/risk_rules"
    headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
    }
    params = {"enabled": "eq.true", "select": "*", "order": "display_order"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            rows = response.json()
            if not rows:
                return [RiskRuleConfig(**r) for r in FALLBACK_RULES]
            return [
                RiskRuleConfig(
                    rule_key=row["rule_key"],
                    category_slug=row["category_slug"],
                    name=row["name"],
                    condition=row.get("condition") or {},
                    weight=float(row.get("weight", 10)),
                    evidence_placeholder=row.get("evidence_placeholder"),
                    explanation=row.get("explanation", ""),
                    enabled=row.get("enabled", True),
                )
                for row in rows
            ]
    except Exception as exc:
        logger.error("Failed to fetch risk rules: %s", exc)
        return [RiskRuleConfig(**r) for r in FALLBACK_RULES]


async def save_assessment(
    user_id: str,
    assessment_type: str,
    input_snapshot: dict,
    output: dict,
    overall_score: float | None,
    cycle_id: str | None = None,
) -> str | None:
    """Persist assessment to risk_assessments table. Returns id or None."""
    if not settings.supabase_url or not settings.supabase_key:
        return None

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/risk_assessments"
    headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    payload = {
        "user_id": user_id,
        "cycle_id": cycle_id,
        "assessment_type": assessment_type,
        "input_snapshot": input_snapshot,
        "output": output,
        "overall_score": overall_score,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            rows = response.json()
            return rows[0]["id"] if rows else None
    except Exception as exc:
        logger.error("Failed to save risk assessment: %s", exc)
        return None


async def fetch_assessment_history(user_id: str, limit: int = 20) -> list[dict]:
    """Fetch risk assessment history for a user."""
    if not settings.supabase_url or not settings.supabase_key:
        return []

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/risk_assessments"
    headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
    }
    params = {
        "user_id": f"eq.{user_id}",
        "select": "id,cycle_id,assessment_type,overall_score,created_at,output",
        "order": "created_at.desc",
        "limit": str(limit),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as exc:
        logger.error("Failed to fetch risk history: %s", exc)
        return []
