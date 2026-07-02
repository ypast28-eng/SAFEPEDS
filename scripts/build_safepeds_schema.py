#!/usr/bin/env python3
"""Build supabase/safepeds_app_complete_schema.sql from migrations."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
OUT = ROOT / "supabase" / "safepeds_app_complete_schema.sql"

ORDER = [
    "20250701000000_create_profiles.sql",
    "20250702000000_compounds_and_cycles.sql",
    "20250702000001_seed_compounds.sql",
    "20250703000000_bloodwork.sql",
    "20250703000001_seed_blood_markers.sql",
    "20250704000000_risk_engine.sql",
    "20250704000001_seed_risk_rules.sql",
    "20250705000000_ai_intelligence.sql",
    "20250705000001_seed_educational_content.sql",
    "20250706000000_knowledge_base.sql",
    "20250706000001_seed_knowledge_base.sql",
    "20250707000000_health_support_library.sql",
    "20250707000001_seed_health_topics.sql",
]

HEADER = """-- =============================================================================
-- SAFEPEDS / PED Health AI — complete schema for Supabase SQL Editor
-- Run once on a NEW empty Supabase project.
-- App tables: profiles, user_cycles, compounds, cycle_compounds,
--             bloodwork_reports, bloodwork_results, bloodwork_history
-- =============================================================================

create extension if not exists "pgcrypto";

"""


def main() -> None:
    parts = [HEADER]
    for name in ORDER:
        path = MIGRATIONS / name
        parts.append(f"-- ─── {name} ───\n")
        parts.append(path.read_text())
        if not parts[-1].endswith("\n"):
            parts.append("\n")
        parts.append("\n")
    OUT.write_text("".join(parts))
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
