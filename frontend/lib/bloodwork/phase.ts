import type { BloodworkPhase } from "@/types/bloodwork";

export function formatBloodworkPhase(phase: BloodworkPhase | null | undefined): string {
  if (phase === "cruise") return "Cruise";
  if (phase === "blast") return "Blast";
  return "Unknown";
}

export function formatBloodworkPhaseLong(phase: BloodworkPhase | null | undefined): string {
  if (phase === "cruise") return "Cruise / Baseline";
  if (phase === "blast") return "Blast / Cycle";
  return "Phase not set";
}

export function phaseBadgeVariant(
  phase: BloodworkPhase | null | undefined
): "primary" | "warning" | "default" {
  if (phase === "cruise") return "primary";
  if (phase === "blast") return "warning";
  return "default";
}
