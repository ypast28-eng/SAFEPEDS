import type { CycleCompoundInput, RiskEngineInput, RiskLevel } from "@/types/risk";
import { scoreToLevel } from "./scoring";
import {
  getCycleMaxDurationWeeks,
  getDailyIu,
  getTotalAnabolicMgPerWeek,
  is19Nor,
  isAnabolicCompound,
  isDhtDerivative,
  isEquipoise,
  isHgh,
  isMasteron,
  isNandrolone,
  isOralCompound,
  isTestosterone,
  isTrenbolone,
} from "./compound-classify";

export type CompoundRiskDetail = {
  compound_id: string;
  compound_name: string;
  weekly_dose: number;
  unit: string;
  frequency_per_week: number;
  duration_weeks: number;
  score: number;
  level: RiskLevel;
  reasons: string[];
  risk_tags: string[];
  monitoring_markers: string[];
};

export type CycleRiskResult = {
  overall_score: number;
  overall_level: RiskLevel;
  synergy_reasons: string[];
  compound_risks: CompoundRiskDetail[];
  total_anabolic_mg_per_week: number;
  duration_weeks: number;
  compound_count: number;
};

const TAG_MARKERS: Record<string, string[]> = {
  cardiovascular: ["Blood Pressure", "Lipid Panel", "CRP"],
  neuropsychiatric: ["Sleep Quality", "Mood"],
  lipids: ["Lipid Panel", "ApoB"],
  "blood pressure": ["Blood Pressure"],
  sleep: ["Sleep Quality"],
  prolactin: ["Prolactin"],
  estrogen: ["Estradiol (E2)", "Blood Pressure"],
  hematocrit: ["Hematocrit", "Hemoglobin", "RBC"],
  rbc: ["RBC", "Hematocrit"],
  acne: ["Skin"],
  "hair loss": ["Hair Loss"],
  androgenic: ["PSA", "DHT"],
  prostate: ["PSA"],
  "sexual side effects": ["Prolactin", "Testosterone"],
  liver: ["ALT", "AST", "GGT"],
  glucose: ["Fasting Glucose", "HbA1c"],
  "insulin resistance": ["Fasting Glucose", "HbA1c", "Fasting Insulin"],
  edema: ["Blood Pressure", "Edema"],
  "carpal tunnel": ["Joint Pain"],
};

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function durationBonus(weeks: number): number {
  if (weeks <= 8) return 5;
  if (weeks <= 12) return 12;
  if (weeks <= 16) return 20;
  if (weeks <= 20) return 28;
  return 35;
}

function doseTierBonus(totalMg: number): number {
  if (totalMg < 300) return 5;
  if (totalMg < 600) return 12;
  if (totalMg < 900) return 22;
  if (totalMg < 1200) return 32;
  return 42;
}

function compoundCountBonus(count: number): number {
  if (count <= 1) return 0;
  let bonus = (count - 1) * 5;
  if (count >= 4) bonus += 10;
  return bonus;
}

function markersFromTags(tags: string[]): string[] {
  const set = new Set<string>();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    for (const [pattern, markers] of Object.entries(TAG_MARKERS)) {
      if (key.includes(pattern) || pattern.includes(key)) {
        markers.forEach((m) => set.add(m));
      }
    }
  }
  return Array.from(set);
}

type CompoundEval = {
  compound: CycleCompoundInput;
  score: number;
  reasons: string[];
  tags: string[];
  is_tren: boolean;
  is_test: boolean;
  is_eq: boolean;
  is_19nor: boolean;
  is_dht: boolean;
  is_oral: boolean;
  is_hgh: boolean;
  weekly_mg: number;
};

function evalCompound(compound: CycleCompoundInput, durationWeeks: number): CompoundEval | null {
  const name = compound.name;
  const reasons: string[] = [];
  const tags: string[] = [];
  let score = 0;

  const weeklyMg = compound.weekly_dose ?? 0;
  const dailyIu = getDailyIu(compound);

  if (isTrenbolone(name)) {
    score += 30;
    reasons.push("Trenbolone base cardiovascular and neuropsychiatric risk");
    tags.push(
      "cardiovascular",
      "neuropsychiatric",
      "lipids",
      "blood pressure",
      "sleep",
      "prolactin",
    );
    if (weeklyMg >= 300) {
      score += 20;
      reasons.push("Trenbolone dose ≥300 mg/week");
    } else if (weeklyMg >= 200) {
      score += 10;
      reasons.push("Trenbolone dose ≥200 mg/week");
    }
    if (durationWeeks > 12) {
      score += 10;
      reasons.push("Trenbolone used beyond 12 weeks");
    }
  } else if (isTestosterone(name, compound.category)) {
    score += 10;
    reasons.push("Testosterone aromatization and hematocrit risk");
    tags.push("estrogen", "blood pressure", "hematocrit", "acne");
    if (weeklyMg >= 500) {
      score += 20;
      reasons.push("Testosterone dose ≥500 mg/week");
    } else if (weeklyMg >= 300) {
      score += 10;
      reasons.push("Testosterone dose ≥300 mg/week");
    }
  } else if (isEquipoise(name, compound.category)) {
    score += 18;
    reasons.push("Boldenone/EQ hematocrit and RBC risk");
    tags.push("hematocrit", "rbc", "blood pressure");
    if (weeklyMg >= 300) {
      score += 10;
      reasons.push("EQ dose ≥300 mg/week");
    }
    if (durationWeeks > 16) {
      score += 15;
      reasons.push("EQ duration beyond 16 weeks");
    }
  } else if (isMasteron(name)) {
    score += 12;
    reasons.push("Masteron lipid and androgenic risk");
    tags.push("lipids", "hair loss", "androgenic", "prostate");
    if (weeklyMg >= 400) {
      score += 10;
      reasons.push("Masteron dose ≥400 mg/week");
    }
  } else if (isNandrolone(name)) {
    score += 22;
    reasons.push("19-nor prolactin and cardiovascular risk");
    tags.push("prolactin", "sexual side effects", "cardiovascular");
    if (weeklyMg >= 300) {
      score += 10;
      reasons.push("Nandrolone dose ≥300 mg/week");
    }
  } else if (isHgh(name, compound.category)) {
    score += 15;
    reasons.push("Growth hormone metabolic and edema risk");
    tags.push("glucose", "insulin resistance", "edema", "carpal tunnel");
    if (dailyIu >= 6) {
      score += 20;
      reasons.push("HGH dose ≥6 IU/day");
    } else if (dailyIu >= 4) {
      score += 10;
      reasons.push("HGH dose ≥4 IU/day");
    }
  } else if (isOralCompound(compound)) {
    score += 25;
    reasons.push("Oral anabolic hepatotoxicity risk");
    tags.push("liver", "lipids", "blood pressure");
    if (durationWeeks > 6) {
      score += 10;
      reasons.push("Oral used beyond 6 weeks");
    }
  } else if (isAnabolicCompound(compound)) {
    score += 8;
    reasons.push("Injectable anabolic compound");
    tags.push("lipids", "blood pressure");
  }

  if (score === 0 && !isHgh(name, compound.category)) return null;

  return {
    compound,
    score: clampScore(score),
    reasons,
    tags,
    is_tren: isTrenbolone(name),
    is_test: isTestosterone(name, compound.category),
    is_eq: isEquipoise(name, compound.category),
    is_19nor: is19Nor(name, compound.category),
    is_dht: isDhtDerivative(name),
    is_oral: isOralCompound(compound),
    is_hgh: isHgh(name, compound.category),
    weekly_mg: weeklyMg,
  };
}

type SynergyResult = {
  bonus: number;
  reasons: string[];
  allocations: Map<string, { bonus: number; reason: string }[]>;
};

function allocate(
  allocations: Map<string, { bonus: number; reason: string }[]>,
  compoundId: string,
  bonus: number,
  reason: string,
) {
  const list = allocations.get(compoundId) ?? [];
  list.push({ bonus, reason });
  allocations.set(compoundId, list);
}

function computeSynergyPenalties(
  evals: CompoundEval[],
  durationWeeks: number,
  totalAnabolicMg: number,
): SynergyResult {
  const reasons: string[] = [];
  const allocations = new Map<string, { bonus: number; reason: string }[]>();
  let bonus = 0;

  const anabolicEvals = evals.filter((e) => !e.is_hgh);
  const anabolicCount = anabolicEvals.length;
  const hasTren = evals.some((e) => e.is_tren);
  const hasTest = evals.some((e) => e.is_test);
  const hasEq = evals.some((e) => e.is_eq);
  const testMg = evals.filter((e) => e.is_test).reduce((s, e) => s + e.weekly_mg, 0);
  const has19Nor = evals.some((e) => e.is_19nor);
  const hasDht = evals.some((e) => e.is_dht);
  const trenEval = evals.find((e) => e.is_tren);
  const testEval = evals.find((e) => e.is_test);
  const eqEval = evals.find((e) => e.is_eq);
  const perCompoundStackShare = anabolicCount >= 4 ? Math.round(15 / anabolicCount) : 0;

  if (hasTren && anabolicCount > 1) {
    bonus += 15;
    reasons.push("Trenbolone stacked with other anabolics");
    if (trenEval) {
      allocate(allocations, trenEval.compound.compound_id, 15, "Stacked with other anabolics");
    }
  }
  if (hasTren && testMg >= 300) {
    bonus += 10;
    reasons.push("Trenbolone with testosterone ≥300 mg/week");
    if (trenEval) {
      allocate(allocations, trenEval.compound.compound_id, 5, "Combined with high-dose testosterone");
    }
    if (testEval) {
      allocate(allocations, testEval.compound.compound_id, 5, "Combined with trenbolone at ≥300 mg/week");
    }
  }
  if (hasEq && hasTest) {
    bonus += 8;
    reasons.push("EQ combined with testosterone");
    if (eqEval) {
      allocate(allocations, eqEval.compound.compound_id, 4, "Combined with testosterone");
    }
    if (testEval) {
      allocate(allocations, testEval.compound.compound_id, 4, "Combined with EQ");
    }
  }
  if (has19Nor && hasDht) {
    bonus += 8;
    reasons.push("19-nor combined with DHT derivative");
    for (const ev of evals.filter((e) => e.is_19nor || e.is_dht)) {
      allocate(
        allocations,
        ev.compound.compound_id,
        4,
        ev.is_19nor ? "19-nor with DHT derivative" : "DHT derivative with 19-nor",
      );
    }
  }
  if (anabolicCount >= 4) {
    bonus += 15;
    reasons.push("Four or more anabolic compounds");
    for (const ev of anabolicEvals) {
      if (perCompoundStackShare > 0) {
        allocate(allocations, ev.compound.compound_id, perCompoundStackShare, "Part of 4+ compound stack");
      }
    }
  }
  if (durationWeeks >= 21) {
    bonus += 10;
    reasons.push("Cycle duration 21+ weeks");
  }
  if (totalAnabolicMg >= 800 && durationWeeks >= 16) {
    bonus += 15;
    reasons.push("High total dose (800+ mg/week) with 16+ week duration");
  }

  return { bonus, reasons, allocations };
}

function displayScore(ev: CompoundEval, synergy: SynergyResult): number {
  const allocated = synergy.allocations.get(ev.compound.compound_id) ?? [];
  const synergyBonus = allocated.reduce((sum, a) => sum + a.bonus, 0);
  let score = ev.score + synergyBonus;

  if (!ev.is_hgh && synergy.reasons.some((r) => r.includes("21+ weeks"))) {
    score += 3;
  }
  if (
    !ev.is_hgh &&
    synergy.reasons.some((r) => r.includes("800+ mg/week")) &&
    (ev.is_tren || ev.is_test || ev.is_eq)
  ) {
    score += 5;
  }
  if (ev.is_dht && !ev.is_hgh && allocated.length > 0) {
    score += 5;
  }

  return clampScore(score);
}

/**
 * Cumulative rule-based cycle risk scorer (not averaged per compound).
 */
export function calculateCycleRisk(input: RiskEngineInput): CycleRiskResult {
  const compounds = input.cycle.compounds ?? [];
  const durationWeeks = getCycleMaxDurationWeeks(compounds);
  const totalAnabolicMg = getTotalAnabolicMgPerWeek(compounds);

  const evals: CompoundEval[] = [];
  for (const c of compounds) {
    const ev = evalCompound(c, durationWeeks);
    if (ev) evals.push(ev);
  }

  const compoundCount = evals.filter((e) => !e.is_hgh).length || evals.length;

  const compoundRuleTotal = evals.reduce((sum, ev) => sum + ev.score, 0);
  const synergy = computeSynergyPenalties(evals, durationWeeks, totalAnabolicMg);

  let overall =
    5 +
    compoundCountBonus(compoundCount) +
    durationBonus(durationWeeks) +
    doseTierBonus(totalAnabolicMg) +
    compoundRuleTotal +
    synergy.bonus;

  overall = clampScore(overall);

  const compound_risks: CompoundRiskDetail[] = evals.map((ev) => {
    const allocated = synergy.allocations.get(ev.compound.compound_id) ?? [];
    const displayReasons = [
      ...ev.reasons,
      ...allocated.map((a) => a.reason),
    ];
    const displayScoreValue = displayScore(ev, synergy);

    return {
      compound_id: ev.compound.compound_id,
      compound_name: ev.compound.name,
      weekly_dose: ev.compound.weekly_dose,
      unit: ev.compound.unit ?? "mg",
      frequency_per_week: ev.compound.frequency_per_week ?? 1,
      duration_weeks: ev.compound.duration_weeks ?? durationWeeks,
      score: displayScoreValue,
      level: scoreToLevel(displayScoreValue),
      reasons: displayReasons,
      risk_tags: ev.tags,
      monitoring_markers: markersFromTags(ev.tags),
    };
  });

  return {
    overall_score: overall,
    overall_level: scoreToLevel(overall),
    synergy_reasons: synergy.reasons,
    compound_risks,
    total_anabolic_mg_per_week: totalAnabolicMg,
    duration_weeks: durationWeeks,
    compound_count: compoundCount,
  };
}
