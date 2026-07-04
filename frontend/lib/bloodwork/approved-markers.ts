/** Approved pathology report categories and marker names (strict whitelist). */

export const APPROVED_BLOODWORK_CATEGORIES = [
  "Androgens",
  "General Chemistry",
  "Liver Function",
  "Hormones",
  "Lipids",
  "Haematology",
] as const;

export type ApprovedBloodworkCategory = (typeof APPROVED_BLOODWORK_CATEGORIES)[number];

export const APPROVED_MARKERS_BY_CATEGORY: Record<
  ApprovedBloodworkCategory,
  readonly string[]
> = {
  Androgens: ["Testosterone", "SHBG", "Free Testosterone"],
  "General Chemistry": [
    "Urea",
    "Creatinine",
    "eGFR",
    "Sodium",
    "Potassium",
    "Chloride",
    "Bicarbonate",
  ],
  "Liver Function": [
    "AST",
    "ALT",
    "Alk Phos",
    "Gamma GT",
    "Total Bilirubin",
    "Total Protein",
    "Albumin",
    "Globulin",
  ],
  Hormones: ["FSH", "LH", "Oestradiol"],
  Lipids: [
    "Cholesterol",
    "Triglyceride",
    "HDL Cholesterol",
    "Chol/HDL Ratio",
    "LDL Cholesterol",
    "Non HDL Cholesterol",
  ],
  Haematology: [
    "Haemoglobin",
    "Red cell count",
    "Haematocrit",
    "MCV",
    "MCH",
    "MCHC",
    "RDW",
    "White cell count",
    "Neutrophils",
    "Lymphocytes",
    "Monocytes",
    "Eosinophils",
    "Basophils",
    "Platelets",
  ],
};

/** PDF / OCR heading → canonical category */
export const CATEGORY_HEADING_ALIASES: Record<string, ApprovedBloodworkCategory> = {
  androgens: "Androgens",
  "general chemistry": "General Chemistry",
  "renal function": "General Chemistry",
  "kidney function": "General Chemistry",
  electrolytes: "General Chemistry",
  "liver function": "Liver Function",
  "liver profile": "Liver Function",
  hormones: "Hormones",
  lipids: "Lipids",
  "lipid studies": "Lipids",
  haematology: "Haematology",
  hematology: "Haematology",
  "full blood count": "Haematology",
  fbc: "Haematology",
};

/** Raw OCR / alias text → canonical marker name (per category when ambiguous). */
export const MARKER_NAME_ALIASES: Record<string, string> = {
  testosterone: "Testosterone",
  shbg: "SHBG",
  "sex hormone binding globulin": "SHBG",
  "free testosterone": "Free Testosterone",
  urea: "Urea",
  bun: "Urea",
  creatinine: "Creatinine",
  egfr: "eGFR",
  "estimated gfr": "eGFR",
  sodium: "Sodium",
  na: "Sodium",
  potassium: "Potassium",
  k: "Potassium",
  chloride: "Chloride",
  cl: "Chloride",
  bicarbonate: "Bicarbonate",
  hco3: "Bicarbonate",
  ast: "AST",
  sgot: "AST",
  alt: "ALT",
  sgpt: "ALT",
  "alk phos": "Alk Phos",
  alp: "Alk Phos",
  "alkaline phosphatase": "Alk Phos",
  "gamma gt": "Gamma GT",
  ggt: "Gamma GT",
  "total bilirubin": "Total Bilirubin",
  bilirubin: "Total Bilirubin",
  "total protein": "Total Protein",
  albumin: "Albumin",
  globulin: "Globulin",
  fsh: "FSH",
  lh: "LH",
  oestradiol: "Oestradiol",
  estradiol: "Oestradiol",
  e2: "Oestradiol",
  cholesterol: "Cholesterol",
  "total cholesterol": "Cholesterol",
  triglyceride: "Triglyceride",
  triglycerides: "Triglyceride",
  tg: "Triglyceride",
  "hdl cholesterol": "HDL Cholesterol",
  hdl: "HDL Cholesterol",
  "ldl cholesterol": "LDL Cholesterol",
  ldl: "LDL Cholesterol",
  "non hdl cholesterol": "Non HDL Cholesterol",
  "non-hdl cholesterol": "Non HDL Cholesterol",
  "chol/hdl ratio": "Chol/HDL Ratio",
  "cholesterol/hdl ratio": "Chol/HDL Ratio",
  haemoglobin: "Haemoglobin",
  hemoglobin: "Haemoglobin",
  hgb: "Haemoglobin",
  "red cell count": "Red cell count",
  rbc: "Red cell count",
  "red blood cell count": "Red cell count",
  haematocrit: "Haematocrit",
  hematocrit: "Haematocrit",
  hct: "Haematocrit",
  mcv: "MCV",
  mch: "MCH",
  mchc: "MCHC",
  rdw: "RDW",
  "white cell count": "White cell count",
  wbc: "White cell count",
  "white blood cell count": "White cell count",
  neutrophils: "Neutrophils",
  lymphocytes: "Lymphocytes",
  monocytes: "Monocytes",
  eosinophils: "Eosinophils",
  basophils: "Basophils",
  platelets: "Platelets",
  plt: "Platelets",
};

/** Canonical whitelist name → UI / database display name. */
export const MARKER_DISPLAY_NAMES: Partial<Record<string, string>> = {
  Cholesterol: "Total Cholesterol",
  "Red cell count": "Red Cell Count",
  "White cell count": "White Cell Count",
};

export function toDisplayMarkerName(canonicalName: string): string {
  return MARKER_DISPLAY_NAMES[canonicalName] ?? canonicalName;
}

export function toCanonicalMarkerName(
  name: string,
  category: ApprovedBloodworkCategory
): string | null {
  return resolveApprovedMarkerName(name, category);
}

const CATEGORY_LOOKUP = new Set(
  APPROVED_BLOODWORK_CATEGORIES.map((c) => normalizeBloodworkKey(c))
);

const ALL_APPROVED_MARKER_KEYS = new Set<string>();
for (const category of APPROVED_BLOODWORK_CATEGORIES) {
  for (const marker of APPROVED_MARKERS_BY_CATEGORY[category]) {
    ALL_APPROVED_MARKER_KEYS.add(normalizeBloodworkKey(marker));
  }
}

export function normalizeBloodworkKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9/%+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isApprovedCategoryName(value: string): value is ApprovedBloodworkCategory {
  return APPROVED_BLOODWORK_CATEGORIES.includes(value as ApprovedBloodworkCategory);
}

export function isCategoryHeadingName(value: string): boolean {
  const key = normalizeBloodworkKey(value);
  if (CATEGORY_LOOKUP.has(key)) return true;
  return key in CATEGORY_HEADING_ALIASES;
}

export function resolveCategoryHeading(line: string): ApprovedBloodworkCategory | null {
  const trimmed = line.trim();
  if (!trimmed || /\d/.test(trimmed)) return null;

  const key = normalizeBloodworkKey(trimmed);
  if (key in CATEGORY_HEADING_ALIASES) {
    return CATEGORY_HEADING_ALIASES[key];
  }

  for (const category of APPROVED_BLOODWORK_CATEGORIES) {
    if (normalizeBloodworkKey(category) === key) {
      return category;
    }
  }

  return null;
}

export function resolveApprovedMarkerName(
  rawName: string,
  category: ApprovedBloodworkCategory
): string | null {
  const cleaned = stripUnitsFromMarkerText(rawName);
  if (!cleaned) return null;

  const approved = APPROVED_MARKERS_BY_CATEGORY[category];
  const rawKey = normalizeBloodworkKey(cleaned);

  for (const marker of [...approved].sort((a, b) => b.length - a.length)) {
    if (normalizeBloodworkKey(marker) === rawKey) {
      return marker;
    }
  }

  const aliasTarget = MARKER_NAME_ALIASES[rawKey];
  if (aliasTarget && approved.includes(aliasTarget)) {
    return aliasTarget;
  }

  for (const marker of [...approved].sort((a, b) => b.length - a.length)) {
    const markerKey = normalizeBloodworkKey(marker);
    if (rawKey === markerKey || rawKey.startsWith(`${markerKey} `)) {
      return marker;
    }
    const alias = MARKER_NAME_ALIASES[markerKey];
    if (alias && normalizeBloodworkKey(alias) === rawKey) {
      return marker;
    }
  }

  return null;
}

export function isApprovedBloodworkMarker(
  category: string,
  markerName: string
): boolean {
  if (!isApprovedCategoryName(category)) return false;
  if (resolveApprovedMarkerName(markerName, category) != null) return true;

  const approved = APPROVED_MARKERS_BY_CATEGORY[category as ApprovedBloodworkCategory];
  const displayKey = normalizeBloodworkKey(markerName);
  return approved.some(
    (marker) => normalizeBloodworkKey(toDisplayMarkerName(marker)) === displayKey
  );
}

/** Search patterns for fallback raw-text extraction (longest names first). */
export function getMarkerSearchPatterns(
  category: ApprovedBloodworkCategory
): Array<{ canonical: string; pattern: RegExp }> {
  return [...APPROVED_MARKERS_BY_CATEGORY[category]]
    .sort((a, b) => b.length - a.length)
    .map((canonical) => {
      const aliases = Object.entries(MARKER_NAME_ALIASES)
        .filter(([, target]) => target === canonical)
        .map(([alias]) => alias);
      const names = [canonical, ...aliases]
        .sort((a, b) => b.length - a.length)
        .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      return {
        canonical,
        pattern: new RegExp(`\\b(?:${names.join("|")})\\b`, "i"),
      };
    });
}

/** Strip trailing lab units accidentally captured in marker names. */
export function stripUnitsFromMarkerText(name: string): string {
  const UNIT_TAIL =
    /\s+(x10\^?\d+\/L|x10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\/L|mmol\/L|nmol\/L|pmol\/L|umol\/L|µmol\/L|mol\/L|g\/L|U\/L|IU\/L|mIU\/L|L\/L|mL\/min\/1\.73m2|fL|pg|%)\s*$/i;

  let cleaned = name.trim();
  while (UNIT_TAIL.test(cleaned)) {
    cleaned = cleaned.replace(UNIT_TAIL, "").trim();
  }
  return cleaned;
}

export const JUNK_LINE_PATTERN =
  /^(page|report|patient|doctor|laboratory|lab|collected|collection|specimen|sample|date|dob|birth|name|address|phone|comment|note|notes|interpretation|method|reference interval|test name|result|units|unit|random|fasting|non fasting|nhi|mrn|ref no|referred|signed|printed|end of report)/i;

export function isJunkTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return true;
  if (JUNK_LINE_PATTERN.test(trimmed)) return true;
  if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(trimmed)) return true;
  if (/^[\d\s/:-]+$/.test(trimmed)) return true;
  return false;
}
