import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "w-full h-10 rounded-lg border bg-surface text-foreground text-sm",
              "placeholder:text-muted/60",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-accent focus:ring-accent/40"
                : "border-border hover:border-border/80",
              leftIcon ? "pl-10" : "px-3",
              rightIcon ? "pr-10" : "px-3",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
