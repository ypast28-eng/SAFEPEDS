/** UI-only constants for cycle builder — not compound data */

export const DOSE_UNITS = ["mg", "mcg", "IU", "ml"] as const;
export type DoseUnit = (typeof DOSE_UNITS)[number];

export const FREQUENCY_OPTIONS = [
  { label: "1× per week", value: 1 },
  { label: "2× per week (E3.5D)", value: 2 },
  { label: "3× per week", value: 3 },
  { label: "Every other day (~3.5×)", value: 4 },
  { label: "5× per week", value: 5 },
  { label: "Daily (7× per week)", value: 7 },
  { label: "2× daily (14× per week)", value: 14 },
] as const;

export const CYCLE_GOAL_SUGGESTIONS = [
  "Bulking",
  "Cutting",
  "Recomposition",
  "TRT / Cruise",
  "PCT",
  "Health Support",
  "Performance",
  "Other",
] as const;
