export const BLOODWORK_REPORTS_CHANGED_EVENT = "bloodwork-reports-changed";

/** Notify dashboard listeners to re-fetch reports from Supabase. */
export function notifyBloodworkReportsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BLOODWORK_REPORTS_CHANGED_EVENT));
}
