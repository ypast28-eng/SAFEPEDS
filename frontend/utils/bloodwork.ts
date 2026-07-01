export function formatLabDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRefRange(low: number | null, high: number | null, unit: string): string {
  if (low === null && high === null) return "—";
  if (low !== null && high !== null) return `${low} – ${high} ${unit}`;
  if (low !== null) return `≥ ${low} ${unit}`;
  return `≤ ${high} ${unit}`;
}
