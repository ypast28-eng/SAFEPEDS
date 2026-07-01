import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full min-h-[88px] rounded-lg border bg-surface text-foreground text-sm px-3 py-2",
            "placeholder:text-muted/60 resize-y transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-accent" : "border-border hover:border-border/80",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
