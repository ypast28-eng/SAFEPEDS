import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "info";
  actions?: React.ReactNode;
  className?: string;
}

/** Consistent page header for authenticated app pages */
export function PageHeader({
  title,
  description,
  badge,
  badgeVariant = "primary",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8", className)}>
      <div>
        {badge && (
          <Badge variant={badgeVariant} className="mb-3">
            {badge}
          </Badge>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 text-muted text-sm sm:text-base max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
