import type { BloodMarker } from "@/types/bloodwork";

export interface RawExtractedMarker {
  name: string;
  value: number;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
}

export interface MatchedExtractedMarker {
  marker_name: string;
  category: string;
  result_value: number;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  marker_id: string | null;
  raw_name: string;
  matched: boolean;
}

/** Common lab report aliases → catalog name */
const ALIASES: Record<string, string> = {
  sgpt: "ALT",
  "alanine aminotransferase": "ALT",
  sgot: "AST",
  "aspartate aminotransferase": "AST",
  "gamma glutamyl transferase": "GGT",
  "gamma-glutamyl transferase": "GGT",
  "alkaline phosphatase": "ALP",
  "total bilirubin": "Bilirubin",
  bilirubin: "Bilirubin",
  "blood urea nitrogen": "Urea",
  bun: "Urea",
  "total cholesterol": "Total Cholesterol",
  "cholesterol total": "Total Cholesterol",
  cholesterol: "Total Cholesterol",
  "hdl cholesterol": "HDL",
  "hdl-c": "HDL",
  "ldl cholesterol": "LDL",
  "ldl-c": "LDL",
  "triglyceride": "Triglycerides",
  tg: "Triglycerides",
  "testosterone total": "Total Testosterone",
  "total testosterone": "Total Testosterone",
  "testosterone free": "Free Testosterone",
  "free testosterone": "Free Testosterone",
  e2: "Estradiol",
  estradiol: "Estradiol",
  "sex hormone binding globulin": "SHBG",
  "white blood cell": "WBC",
  "white blood cells": "WBC",
  leukocytes: "WBC",
  "red blood cell": "RBC",
  "red blood cells": "RBC",
  erythrocytes: "RBC",
  "platelet count": "Platelets",
  plt: "Platelets",
  hgb: "Hemoglobin",
  hct: "Hematocrit",
  "estimated gfr": "eGFR",
  egfr: "eGFR",
  "c reactive protein": "CRP",
  "c-reactive protein": "CRP",
  hba1c: "HbA1c",
  "hemoglobin a1c": "HbA1c",
  "prostate specific antigen": "PSA",
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveCatalogName(rawName: string): string {
  const normalized = normalize(rawName);
  return ALIASES[normalized] ?? rawName.trim();
}

function findCatalogMarker(name: string, catalog: BloodMarker[]): BloodMarker | undefined {
  const resolved = resolveCatalogName(name);
  const resolvedNorm = normalize(resolved);

  const exact = catalog.find((m) => normalize(m.name) === resolvedNorm);
  if (exact) return exact;

  const byRaw = catalog.find((m) => normalize(m.name) === normalize(name));
  if (byRaw) return byRaw;

  return catalog.find((m) => {
    const catalogNorm = normalize(m.name);
    return (
      catalogNorm.includes(resolvedNorm) ||
      resolvedNorm.includes(catalogNorm) ||
      catalogNorm.includes(normalize(name)) ||
      normalize(name).includes(catalogNorm)
    );
  });
}

export function matchExtractedMarkers(
  raw: RawExtractedMarker[],
  catalog: BloodMarker[]
): MatchedExtractedMarker[] {
  return raw
    .filter((item) => item.name.trim() && Number.isFinite(item.value))
    .map((item) => {
      const marker = findCatalogMarker(item.name, catalog);
      return {
        marker_name: marker?.name ?? item.name.trim(),
        category: marker?.category ?? "Other",
        result_value: item.value,
        unit: item.unit?.trim() || marker?.default_unit || "",
        reference_low: item.reference_low ?? marker?.default_reference_low ?? null,
        reference_high: item.reference_high ?? marker?.default_reference_high ?? null,
        marker_id: marker?.id ?? null,
        raw_name: item.name.trim(),
        matched: Boolean(marker),
      };
    });
}
