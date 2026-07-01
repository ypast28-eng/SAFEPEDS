import { cn } from "@/utils/cn";
import type { BadgeVariant } from "@/types";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-muted border-border",
  primary: "bg-primary/15 text-primary border-primary/30",
  secondary: "bg-secondary/15 text-secondary border-secondary/30",
  success: "bg-green-500/15 text-green-400 border-green-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  danger: "bg-accent/15 text-accent border-accent/30",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "primary" && "bg-primary",
            variant === "secondary" && "bg-secondary",
            variant === "success" && "bg-green-400",
            variant === "warning" && "bg-amber-400",
            variant === "danger" && "bg-accent",
            variant === "info" && "bg-blue-400",
            variant === "default" && "bg-muted"
          )}
        />
      )}
      {children}
    </span>
  );
}
