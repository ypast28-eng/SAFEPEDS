import type { BloodworkReport } from "@/types/bloodwork";

type SortableReport = Pick<BloodworkReport, "collection_date" | "created_at">;

/** Newest report first: collection_date desc, then created_at desc. */
export function sortBloodworkReportsByRecency<T extends SortableReport>(reports: T[]): T[] {
  return [...reports].sort((a, b) => {
    const dateDiff =
      new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime();

    if (dateDiff !== 0) return dateDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
