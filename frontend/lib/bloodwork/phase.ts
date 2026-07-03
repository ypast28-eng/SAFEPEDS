import type { BloodworkPhase } from "@/types/bloodwork";

export const DEFAULT_BLOODWORK_PHASE: BloodworkPhase = "cruise";

export function resolveBloodworkPhase(
  phase: BloodworkPhase | null | undefined
): BloodworkPhase {
  if (phase === "cruise" || phase === "blast" || phase === "off" || phase === "unknown") {
    return phase;
  }
  return DEFAULT_BLOODWORK_PHASE;
}

export function formatBloodworkPhase(phase: BloodworkPhase | null | undefined): string {
  if (phase === "cruise") return "Cruise";
  if (phase === "blast") return "Blast";
  if (phase === "off") return "Off";
  if (phase === "unknown") return "Unknown";
  return "Cruise";
}

export function formatBloodworkPhaseLong(phase: BloodworkPhase | null | undefined): string {
  if (phase === "cruise") return "Cruise / Baseline";
  if (phase === "blast") return "Blast / Cycle";
  if (phase === "off") return "Off / Between phases";
  if (phase === "unknown") return "Unknown phase";
  return "Cruise / Baseline";
}

export function phaseBadgeVariant(
  phase: BloodworkPhase | null | undefined
): "primary" | "warning" | "default" | "info" {
  if (phase === "cruise") return "primary";
  if (phase === "blast") return "warning";
  if (phase === "off") return "info";
  return "default";
}
