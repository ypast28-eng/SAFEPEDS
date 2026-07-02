import type {
  AiInsightsDashboard,
  BiomarkerAnalysis,
  CompoundCorrelation,
  CruiseBlastComparison,
  HealthScoreLabel,
  InsightsBloodworkPoint,
  InsightsCycleSummary,
  InsightsStructuredContext,
  MarkerStatusLabel,
  MarkerTrendTimeline,
  OrganSystemCard,
  OrganStatus,
  PriorityFinding,
  RiskLevelLabel,
  TrendLabel,
} from "@/types/ai-insights";

const ORGAN_MARKERS: Record<OrganSystemCard["system"], string[]> = {
  cardiovascular: ["hematocrit", "hemoglobin", "blood pressure", "rbc", "red blood cell"],
  blood: ["hematocrit", "hemoglobin", "rbc", "wbc", "platelet", "mcv", "mch"],
  hormones: ["testosterone", "estradiol", "e2", "lh", "fsh", "prolactin", "shbg"],
  lipids: ["hdl", "ldl", "cholesterol", "triglyceride", "triglycerides"],
  liver: ["alt", "ast", "ggt", "bilirubin", "alp"],
  kidney: ["creatinine", "egfr", "bun", "urea"],
};

const COMPOUND_EDUCATION: Record<string, string[]> = {
  testosterone: ["May influence hematocrit/RBC", "May influence estradiol", "May influence lipids"],
  "masteron": ["May reduce HDL in some educational monitoring contexts"],
  "drostanolone": ["May reduce HDL in some educational monitoring contexts"],
  eq: ["May influence hematocrit/RBC", "May influence appetite markers in educational contexts"],
  "boldenone": ["May influence hematocrit/RBC"],
  trenbolone: ["May reduce HDL", "May influence blood pressure in educational contexts"],
  "oral": ["May elevate liver enzymes (ALT/AST)", "May influence lipids"],
  anavar: ["May elevate liver enzymes at higher doses", "May influence lipids"],
  dianabol: ["May elevate liver enzymes (ALT/AST)", "May influence lipids"],
};

function matchMarker(systemMarkers: string[], markerName: string): boolean {
  const lower = markerName.toLowerCase();
  return systemMarkers.some((m) => lower.includes(m));
}

function formatRef(low: number | null, high: number | null, unit: string): string {
  if (low != null && high != null) return `${low}–${high} ${unit}`;
  if (low != null) return `≥ ${low} ${unit}`;
  if (high != null) return `≤ ${high} ${unit}`;
  return "Not provided";
}

function deriveStatus(
  value: number,
  low: number | null,
  high: number | null,
  stored: string | null
): MarkerStatusLabel {
  if (stored === "Low" || stored === "High") return stored;
  if (low != null && value < low) return "Low";
  if (high != null && value > high) return "High";
  if (low != null && high != null) {
    const span = high - low;
    if (span > 0) {
      const nearLow = value <= low + span * 0.1;
      const nearHigh = value >= high - span * 0.1;
      if (nearLow || nearHigh) return "Borderline";
    }
  }
  return "Normal";
}

function computeTrend(
  points: InsightsBloodworkPoint[]
): { trend: TrendLabel; detail: string } {
  if (points.length < 2) {
    return { trend: "Stable", detail: "Insufficient history for trend analysis." };
  }

  const sorted = [...points].sort(
    (a, b) => new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const delta = last.result_value - first.result_value;
  const recentDelta = last.result_value - prev.result_value;
  const pct = first.result_value !== 0 ? Math.abs(delta / first.result_value) : Math.abs(delta);
  const recentPct =
    prev.result_value !== 0 ? Math.abs(recentDelta / prev.result_value) : Math.abs(recentDelta);

  let trend: TrendLabel = "Stable";
  if (Math.abs(delta) < 0.01) trend = "Stable";
  else if (delta > 0) trend = recentPct >= 0.25 || pct >= 0.4 ? "Rapid Increase" : "Increasing";
  else trend = recentPct >= 0.25 || pct >= 0.4 ? "Rapid Decrease" : "Decreasing";

  if (trend === "Increasing" && recentPct >= 0.15 && last.status === "Normal") {
    trend = "Large Increase";
  }
  if (trend === "Decreasing" && recentPct >= 0.15 && last.status === "Normal") {
    trend = "Large Decrease";
  }

  const detail =
    trend === "Stable"
      ? "Values have remained relatively stable across logged tests."
      : `${last.marker_name} changed from ${first.result_value} (${first.collection_date}) to ${last.result_value} (${last.collection_date}) ${last.unit}.`;

  return { trend, detail };
}

function pedAssociations(markerName: string, compounds: InsightsCycleSummary[]): string {
  const lower = markerName.toLowerCase();
  const names = compounds.flatMap((c) => c.compounds.map((x) => x.name.toLowerCase()));
  const notes: string[] = [];

  if (lower.includes("hematocrit") || lower.includes("rbc") || lower.includes("hemoglobin")) {
    if (names.some((n) => n.includes("test") || n.includes("eq") || n.includes("bold"))) {
      notes.push("Educational association: testosterone and EQ are sometimes discussed alongside RBC/hematocrit monitoring.");
    }
  }
  if (lower.includes("hdl") || lower.includes("ldl") || lower.includes("triglycer")) {
    if (names.some((n) => n.includes("tren") || n.includes("masteron") || n.includes("oral"))) {
      notes.push("Educational association: some androgenic/oral compounds are discussed alongside lipid panel changes — not proof of causation.");
    }
  }
  if (lower.includes("alt") || lower.includes("ast") || lower.includes("ggt")) {
    if (names.some((n) => n.includes("oral") || n.includes("anavar") || n.includes("dbol"))) {
      notes.push("Educational association: oral compounds are commonly discussed alongside liver enzyme monitoring.");
    }
  }

  if (notes.length === 0) {
    return "General educational monitoring marker — discuss trends with a qualified healthcare provider.";
  }
  return notes.join(" ");
}

function scoreOrgan(
  system: OrganSystemCard["system"],
  markers: BiomarkerAnalysis[]
): OrganSystemCard {
  const labels: Record<OrganSystemCard["system"], string> = {
    cardiovascular: "Cardiovascular",
    blood: "Blood",
    hormones: "Hormones",
    lipids: "Lipids",
    liver: "Liver",
    kidney: "Kidney",
  };
  const icons: Record<OrganSystemCard["system"], string> = {
    cardiovascular: "❤️",
    blood: "🩸",
    hormones: "🧠",
    lipids: "🫀",
    liver: "🟢",
    kidney: "🟢",
  };

  const relevant = markers.filter((m) => matchMarker(ORGAN_MARKERS[system], m.marker_name));
  let status: OrganStatus = "Good";
  if (relevant.some((m) => m.status === "High" || m.status === "Low")) status = "Needs Attention";
  else if (relevant.some((m) => m.trend.includes("Rapid") || m.trend.includes("Large"))) status = "Monitor";
  else if (relevant.some((m) => m.status === "Borderline")) status = "Monitor";
  if (relevant.filter((m) => m.status === "High").length >= 2) status = "Critical";

  const summary =
    relevant.length === 0
      ? "No logged markers in this category yet."
      : `${relevant.length} marker(s) tracked. ${status === "Good" ? "No major educational flags from supplied ranges." : "Review flagged markers with your clinician."}`;

  return {
    system,
    label: labels[system],
    icon: icons[system],
    status,
    summary,
    markers: relevant.map((m) => m.marker_name),
  };
}

function pointsForReport(
  ctx: InsightsStructuredContext,
  reportId: string
): InsightsBloodworkPoint[] {
  return ctx.historical_bloodwork.filter((p) => p.report_id === reportId);
}

function latestReportByPhase(
  ctx: InsightsStructuredContext,
  phase: "cruise" | "blast"
): (typeof ctx.bloodwork_reports)[number] | null {
  return (
    [...ctx.bloodwork_reports]
      .filter((r) => r.phase === phase)
      .sort(
        (a, b) =>
          new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime()
      )[0] ?? null
  );
}

function previousReportByPhase(
  ctx: InsightsStructuredContext,
  phase: "cruise" | "blast",
  excludeReportId: string
): (typeof ctx.bloodwork_reports)[number] | null {
  return (
    [...ctx.bloodwork_reports]
      .filter((r) => r.phase === phase && r.id !== excludeReportId)
      .sort(
        (a, b) =>
          new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime()
      )[0] ?? null
  );
}

function isWorseningMarker(markerName: string, delta: number): boolean {
  const lower = markerName.toLowerCase();
  const higherIsBad =
    lower.includes("alt") ||
    lower.includes("ast") ||
    lower.includes("ldl") ||
    lower.includes("triglycer") ||
    lower.includes("hematocrit") ||
    lower.includes("estradiol") ||
    lower.includes("creatinine");
  const lowerIsBad = lower.includes("hdl") || lower.includes("egfr");
  if (higherIsBad) return delta > 0;
  if (lowerIsBad) return delta < 0;
  return Math.abs(delta) > 0;
}

function buildCruiseBlastComparison(
  ctx: InsightsStructuredContext
): CruiseBlastComparison | null {
  const latestReport = ctx.bloodwork_reports[0] ?? null;
  const currentPhase = latestReport?.phase ?? null;

  const cruiseReport = latestReportByPhase(ctx, "cruise");
  const blastReport = latestReportByPhase(ctx, "blast");

  const cruiseBlood = cruiseReport ? pointsForReport(ctx, cruiseReport.id) : [];
  const blastBlood = blastReport ? pointsForReport(ctx, blastReport.id) : [];

  const cruiseCycle = [...(ctx.current_cycle ? [ctx.current_cycle] : []), ...ctx.previous_cycles].find(
    (c) => c.classification === "cruise"
  ) ?? null;
  const blastCycle = [...(ctx.current_cycle ? [ctx.current_cycle] : []), ...ctx.previous_cycles].find(
    (c) => c.classification === "blast"
  ) ?? null;

  if (!cruiseReport && !blastReport && !currentPhase) return null;

  const activeBloodwork =
    currentPhase === "blast"
      ? blastBlood
      : currentPhase === "cruise"
        ? cruiseBlood
        : ctx.current_bloodwork;

  const markers_outside_clinical_range = activeBloodwork
    .filter((p) => p.status === "Low" || p.status === "High")
    .map((p) => ({
      marker_name: p.marker_name,
      value: p.result_value,
      unit: p.unit,
      status: p.status ?? "Out of range",
    }));

  const cruiseByMarker = new Map(cruiseBlood.map((p) => [p.marker_name, p]));
  const blastByMarker = new Map(blastBlood.map((p) => [p.marker_name, p]));

  const compareMarkers = new Set([
    ...cruiseBlood.map((p) => p.marker_name),
    ...blastBlood.map((p) => p.marker_name),
  ]);

  const markers_changed_from_baseline: CruiseBlastComparison["markers_changed_from_baseline"] = [];
  const markers_worsened_during_blast: CruiseBlastComparison["markers_worsened_during_blast"] = [];
  const marker_differences: CruiseBlastComparison["marker_differences"] = [];

  for (const name of compareMarkers) {
    const baseline = cruiseByMarker.get(name);
    const blast = blastByMarker.get(name);
    const current = currentPhase === "blast" ? blast : baseline ?? blast;

    if (baseline && current && baseline.result_value !== current.result_value) {
      const direction =
        current.result_value > baseline.result_value ? "higher" : "lower";
      markers_changed_from_baseline.push({
        marker_name: name,
        baseline_value: baseline.result_value,
        current_value: current.result_value,
        unit: current.unit,
        note: `${direction} than cruise baseline (${baseline.result_value} → ${current.result_value} ${current.unit}). Educational observation only.`,
      });
    }

    if (baseline && blast) {
      const delta = blast.result_value - baseline.result_value;
      if (delta !== 0) {
        marker_differences.push({
          marker_name: name,
          cruise_value: baseline.result_value,
          blast_value: blast.result_value,
          unit: blast.unit,
          note:
            delta > 0
              ? `Higher during blast phase (${blast.result_value} vs ${baseline.result_value} ${blast.unit}). Educational observation only.`
              : `Lower during blast phase (${blast.result_value} vs ${baseline.result_value} ${blast.unit}). Educational observation only.`,
        });
        if (currentPhase === "blast" && isWorseningMarker(name, delta)) {
          markers_worsened_during_blast.push({
            marker_name: name,
            note: `Moved from cruise baseline ${baseline.result_value} to ${blast.result_value} ${blast.unit} during blast phase.`,
          });
        }
      }
    }
  }

  const markers_improved_since_last_test: CruiseBlastComparison["markers_improved_since_last_test"] =
    [];
  if (latestReport && (currentPhase === "cruise" || currentPhase === "blast")) {
    const previous = previousReportByPhase(ctx, currentPhase, latestReport.id);
    if (previous) {
      const prevPoints = pointsForReport(ctx, previous.id);
      const latestPoints = pointsForReport(ctx, latestReport.id);
      for (const current of latestPoints) {
        const prev = prevPoints.find((p) => p.marker_name === current.marker_name);
        if (!prev) continue;
        const delta = current.result_value - prev.result_value;
        if (isWorseningMarker(current.marker_name, delta)) continue;
        if (delta !== 0) {
          markers_improved_since_last_test.push({
            marker_name: current.marker_name,
            note: `Improved from ${prev.result_value} (${previous.collection_date}) to ${current.result_value} (${latestReport.collection_date}) ${current.unit}.`,
          });
        }
      }
    }
  }

  const educational_explanation =
    currentPhase === "cruise"
      ? "Cruise-phase bloodwork is stored as your personal baseline. Some markers may still fall outside standard lab reference ranges — that is common and worth discussing with a qualified healthcare provider."
      : currentPhase === "blast"
        ? "During blast phases, some markers may shift compared with cruise baseline due to higher compound exposure, training load, diet, hydration, or lab variability. These patterns are educational observations, not diagnoses."
        : "Tag bloodwork as cruise (baseline) or blast (cycle) when logging panels to unlock personal baseline comparisons alongside standard reference ranges.";

  const return_to_baseline_note =
    currentPhase === "blast" && cruiseReport
      ? `After your blast phase ends, a follow-up cruise panel can help you compare whether markers are returning toward your baseline established on ${cruiseReport.collection_date}.`
      : currentPhase === "cruise" && blastReport
        ? `Your latest cruise panel can serve as a return-to-baseline comparison after blast bloodwork from ${blastReport.collection_date}.`
        : "Log cruise bloodwork after a blast phase to track how markers change when returning to maintenance.";

  let analysis = "";
  if (currentPhase === "cruise") {
    analysis = `Current phase: Cruise. This panel is treated as baseline data with ${cruiseBlood.length} marker(s) logged.`;
  } else if (currentPhase === "blast") {
    analysis = `Current phase: Blast. Compared against clinical reference ranges${
      cruiseReport ? ` and cruise baseline from ${cruiseReport.collection_date}` : " (no cruise baseline yet)"
    }${blastCycle ? ` and logged cycle context (${blastCycle.cycle_name})` : ""}.`;
  } else {
    analysis = "Phase not set on latest bloodwork. Select cruise or blast when adding new panels for personalized comparisons.";
  }

  return {
    current_phase: currentPhase,
    latest_cruise_report: cruiseReport
      ? { report_name: cruiseReport.report_name, collection_date: cruiseReport.collection_date }
      : null,
    latest_blast_report: blastReport
      ? { report_name: blastReport.report_name, collection_date: blastReport.collection_date }
      : null,
    has_cruise_baseline: cruiseReport != null,
    markers_outside_clinical_range,
    markers_changed_from_baseline: markers_changed_from_baseline.slice(0, 12),
    markers_worsened_during_blast: markers_worsened_during_blast.slice(0, 8),
    markers_improved_since_last_test: markers_improved_since_last_test.slice(0, 8),
    educational_explanation,
    return_to_baseline_note,
    cruise_cycle: cruiseCycle,
    blast_cycle: blastCycle,
    cruise_bloodwork: cruiseBlood,
    blast_bloodwork: blastBlood,
    marker_differences: marker_differences.slice(0, 12),
    analysis,
  };
}

function buildCompoundCorrelations(cycles: InsightsCycleSummary[]): CompoundCorrelation[] {
  const seen = new Set<string>();
  const result: CompoundCorrelation[] = [];

  for (const cycle of cycles) {
    for (const compound of cycle.compounds) {
      const key = compound.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const associations: string[] = [];
      for (const [pattern, notes] of Object.entries(COMPOUND_EDUCATION)) {
        if (key.includes(pattern) || (compound.category?.toLowerCase().includes(pattern) ?? false)) {
          associations.push(...notes);
        }
      }
      if (compound.administration?.toLowerCase().includes("oral")) {
        associations.push(...(COMPOUND_EDUCATION.oral ?? []));
      }
      if (associations.length === 0) {
        associations.push("General educational monitoring context for this compound category.");
      }

      result.push({
        compound_name: compound.name,
        educational_associations: [...new Set(associations)],
        disclaimer: "Possible educational associations only — not proof of causation.",
      });
    }
  }
  return result.slice(0, 10);
}

function computeHealthScore(
  biomarkers: BiomarkerAnalysis[],
  risk: InsightsStructuredContext["risk_assessment"]
): { score: number; label: HealthScoreLabel; explanation: string } {
  let score = 88;
  const abnormal = biomarkers.filter((m) => m.status === "High" || m.status === "Low").length;
  const borderline = biomarkers.filter((m) => m.status === "Borderline").length;
  const rapid = biomarkers.filter((m) => m.trend.includes("Rapid") || m.trend.includes("Large")).length;

  score -= abnormal * 8;
  score -= borderline * 3;
  score -= rapid * 4;
  if (risk) score -= Math.min(20, Math.floor(risk.overall_score / 8));

  score = Math.max(15, Math.min(98, score));

  let label: HealthScoreLabel = "Good";
  if (score >= 85) label = "Excellent";
  else if (score >= 70) label = "Good";
  else if (score >= 55) label = "Fair";
  else label = "Needs Attention";

  return {
    score,
    label,
    explanation: `Educational score based on ${biomarkers.length} logged markers, trend flags, and rule-based cycle risk context. Not a clinical health grade.`,
  };
}

function computeRiskLevel(
  biomarkers: BiomarkerAnalysis[],
  risk: InsightsStructuredContext["risk_assessment"]
): { level: RiskLevelLabel; explanation: string } {
  const highMarkers = biomarkers.filter((m) => m.status === "High").length;
  const rapid = biomarkers.filter((m) => m.trend.includes("Rapid")).length;
  const riskScore = risk?.overall_score ?? 0;

  if (highMarkers >= 3 || rapid >= 2 || riskScore >= 70) {
    return {
      level: "High",
      explanation: "Multiple out-of-range markers, rapid trend flags, and/or elevated rule-based monitoring priority.",
    };
  }
  if (highMarkers >= 1 || riskScore >= 45) {
    return {
      level: "Moderate",
      explanation: "Some markers or cycle context warrant closer educational monitoring.",
    };
  }
  return {
    level: "Low",
    explanation: "Fewer educational flags from logged bloodwork and cycle context.",
  };
}

export function analyzeInsightsData(ctx: InsightsStructuredContext): {
  biomarker_analyses: BiomarkerAnalysis[];
  trend_timelines: MarkerTrendTimeline[];
  organ_systems: OrganSystemCard[];
  priority_findings: PriorityFinding[];
  positive_findings: string[];
  health_score: number;
  health_score_label: HealthScoreLabel;
  health_score_explanation: string;
  risk_level: RiskLevelLabel;
  risk_explanation: string;
  cruise_blast_comparison: CruiseBlastComparison | null;
  compound_correlations: CompoundCorrelation[];
  abnormal_findings: string[];
} {
  const byMarker = new Map<string, InsightsBloodworkPoint[]>();
  for (const point of ctx.historical_bloodwork) {
    const list = byMarker.get(point.marker_name) ?? [];
    list.push(point);
    byMarker.set(point.marker_name, list);
  }

  const allCycles = [
    ...(ctx.current_cycle ? [ctx.current_cycle] : []),
    ...ctx.previous_cycles,
  ];

  const biomarker_analyses: BiomarkerAnalysis[] = [...byMarker.entries()].map(([name, points]) => {
    const sorted = [...points].sort(
      (a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime()
    );
    const current = sorted[0];
    const { trend, detail } = computeTrend(points);
    const status = deriveStatus(
      current.result_value,
      current.reference_low,
      current.reference_high,
      current.status
    );

    return {
      marker_name: name,
      current_value: current.result_value,
      unit: current.unit,
      reference_range: formatRef(current.reference_low, current.reference_high, current.unit),
      status,
      trend,
      trend_detail: detail,
      educational_significance:
        status === "High" || status === "Low"
          ? `${name} is outside your supplied reference range. This is not a diagnosis.`
          : trend.includes("Increase") || trend.includes("Decrease")
            ? `${name} shows a notable trend across logged tests — review with your clinician.`
            : `${name} is within supplied reference range based on latest result.`,
      possible_ped_associations: pedAssociations(name, allCycles),
      history: sorted
        .slice(0, 6)
        .reverse()
        .map((p) => ({
          date: p.collection_date,
          value: p.result_value,
          status: p.status,
        })),
    };
  });

  biomarker_analyses.sort((a, b) => {
    const priority = (m: BiomarkerAnalysis) =>
      (m.status === "High" || m.status === "Low" ? 3 : m.status === "Borderline" ? 2 : 1) +
      (m.trend.includes("Rapid") || m.trend.includes("Large") ? 2 : 0);
    return priority(b) - priority(a);
  });

  const trend_timelines: MarkerTrendTimeline[] = biomarker_analyses
    .filter((m) => m.history.length >= 2)
    .slice(0, 8)
    .map((m) => ({
      marker_name: m.marker_name,
      unit: m.unit,
      points: m.history.map((h) => ({ date: h.date, value: h.value })),
      analysis: m.trend_detail,
    }));

  const organ_systems = (
    ["cardiovascular", "blood", "hormones", "lipids", "liver", "kidney"] as const
  ).map((s) => scoreOrgan(s, biomarker_analyses));

  const priority_findings: PriorityFinding[] = biomarker_analyses
    .filter((m) => m.status !== "Normal" || m.trend.includes("Rapid") || m.trend.includes("Large"))
    .slice(0, 8)
    .map((m) => ({
      title:
        m.status === "High" || m.status === "Low"
          ? `${m.status === "High" ? "Elevated" : "Low"} ${m.marker_name}`
          : `${m.marker_name} trend: ${m.trend}`,
      severity:
        m.status === "High" || m.trend.includes("Rapid")
          ? "High"
          : m.status === "Low" || m.trend.includes("Large")
            ? "Moderate"
            : "Low",
      why_it_matters: `Educational monitoring context for ${m.marker_name} in performance health tracking.`,
      educational_explanation: m.educational_significance,
      monitoring_advice: "Discuss persistent changes with a qualified healthcare provider using your lab's reference ranges.",
      marker_name: m.marker_name,
    }));

  const positive_findings: string[] = [];
  for (const m of biomarker_analyses) {
    if (m.trend === "Decreasing" && (m.marker_name.toLowerCase().includes("alt") || m.marker_name.toLowerCase().includes("ast"))) {
      positive_findings.push(`${m.marker_name} has trended down across logged tests.`);
    }
    if (m.status === "Normal" && m.trend === "Stable" && ["creatinine", "egfr", "bun"].some((k) => m.marker_name.toLowerCase().includes(k))) {
      positive_findings.push(`Kidney-related marker ${m.marker_name} appears stable.`);
    }
    if (m.trend === "Increasing" && m.marker_name.toLowerCase().includes("hdl")) {
      positive_findings.push(`HDL has increased since earlier logged results.`);
    }
  }
  if (positive_findings.length === 0 && biomarker_analyses.length > 0) {
    const normalCount = biomarker_analyses.filter((m) => m.status === "Normal").length;
    if (normalCount > 0) {
      positive_findings.push(`${normalCount} marker(s) are within your supplied reference ranges on the latest panel.`);
    }
  }

  const health = computeHealthScore(biomarker_analyses, ctx.risk_assessment);
  const risk = computeRiskLevel(biomarker_analyses, ctx.risk_assessment);

  const abnormal_findings = biomarker_analyses
    .filter((m) => m.status !== "Normal")
    .map((m) => `${m.marker_name}: ${m.current_value} ${m.unit} (${m.status})`);

  return {
    biomarker_analyses,
    trend_timelines,
    organ_systems,
    priority_findings,
    positive_findings: positive_findings.slice(0, 6),
    health_score: health.score,
    health_score_label: health.label,
    health_score_explanation: health.explanation,
    risk_level: risk.level,
    risk_explanation: risk.explanation,
    cruise_blast_comparison: buildCruiseBlastComparison(ctx),
    compound_correlations: buildCompoundCorrelations(allCycles),
    abnormal_findings,
  };
}

export function mergeAnalysisIntoDashboard(
  ctx: InsightsStructuredContext,
  analysis: ReturnType<typeof analyzeInsightsData>,
  aiNarrative: Partial<
    Pick<
      AiInsightsDashboard,
      | "summary"
      | "trend_analysis"
      | "long_term_trends"
      | "recommendations"
      | "related_articles"
      | "scientific_references"
    >
  >,
  disclaimer: string
): AiInsightsDashboard {
  return {
    disclaimer,
    generated_at: new Date().toISOString(),
    has_bloodwork: ctx.current_bloodwork.length > 0,
    data_summary: {
      bloodwork_report_count: ctx.bloodwork_reports.length,
      cycle_count: (ctx.current_cycle ? 1 : 0) + ctx.previous_cycles.length,
      marker_data_points: ctx.historical_bloodwork.length,
    },
    overall_health_score: analysis.health_score,
    health_score_label: analysis.health_score_label,
    health_score_explanation: analysis.health_score_explanation,
    risk_level: analysis.risk_level,
    risk_explanation: analysis.risk_explanation,
    priority_findings: analysis.priority_findings,
    positive_findings: analysis.positive_findings,
    organ_systems: analysis.organ_systems,
    biomarker_analyses: analysis.biomarker_analyses,
    trend_timelines: analysis.trend_timelines,
    cruise_blast_comparison: analysis.cruise_blast_comparison,
    compound_correlations: analysis.compound_correlations,
    summary: aiNarrative.summary ?? "Educational health intelligence summary based on your logged data.",
    abnormal_findings: analysis.abnormal_findings,
    trend_analysis: aiNarrative.trend_analysis ?? "Review marker trend cards for chronological changes.",
    long_term_trends: aiNarrative.long_term_trends ?? "Log bloodwork regularly to strengthen long-term trend analysis.",
    recommendations: aiNarrative.recommendations ?? [
      "Continue routine bloodwork logging for educational trend review.",
      "Discuss out-of-range markers with a qualified healthcare provider.",
    ],
    related_articles: aiNarrative.related_articles ?? [],
    scientific_references: aiNarrative.scientific_references ?? [],
  };
}
