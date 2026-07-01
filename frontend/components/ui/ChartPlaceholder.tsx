import { BarChart3 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card, CardHeader, CardTitle, CardDescription } from "./Card";
import { Chart } from "./Chart";
import type { ChartDataPoint } from "@/types";

export interface ChartPlaceholderProps {
  title?: string;
  description?: string;
  type?: "line" | "bar" | "area";
  data?: ChartDataPoint[];
  height?: number;
  className?: string;
  showPlaceholder?: boolean;
}

/** Sample data for demo charts */
const SAMPLE_DATA: ChartDataPoint[] = [
  { label: "Jan", value: 42 },
  { label: "Feb", value: 38 },
  { label: "Mar", value: 55 },
  { label: "Apr", value: 48 },
  { label: "May", value: 62 },
  { label: "Jun", value: 58 },
];

export function ChartPlaceholder({
  title = "Chart",
  description,
  type = "area",
  data = SAMPLE_DATA,
  height = 240,
  className,
  showPlaceholder = false,
}: ChartPlaceholderProps) {
  if (showPlaceholder) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/50"
          style={{ height }}
        >
          <BarChart3 className="h-10 w-10 text-muted mb-3" />
          <p className="text-sm text-muted">Chart data will appear here</p>
          <p className="text-xs text-muted/60 mt-1">Connect bloodwork to visualize trends</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <Chart type={type} data={data} height={height} />
    </Card>
  );
}
