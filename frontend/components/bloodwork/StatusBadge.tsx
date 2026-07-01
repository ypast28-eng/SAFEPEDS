import { Badge } from "@/components/ui";
import type { BloodworkStatus } from "@/types/bloodwork";

const VARIANT_MAP: Record<BloodworkStatus, "info" | "success" | "warning" | "danger"> = {
  Low: "info",
  Normal: "success",
  High: "danger",
};

interface StatusBadgeProps {
  status: BloodworkStatus | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return <Badge variant="default">—</Badge>;
  }
  return (
    <Badge variant={VARIANT_MAP[status]} dot>
      {status}
    </Badge>
  );
}
