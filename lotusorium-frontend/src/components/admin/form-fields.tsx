import * as React from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

/** Label + optional hint/error wrapper around any control. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlBase, "min-h-24 resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(controlBase, "pr-9", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

/**
 * Checkbox + inline label row. Forwards the ref to the input so it works when
 * spread with react-hook-form's `register()` (which supplies a ref).
 */
export const CheckboxField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
  }
>(({ label, hint, ...props }, ref) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card px-3.5 py-3 text-sm">
    <input
      ref={ref}
      type="checkbox"
      className="mt-0.5 size-4 accent-primary"
      {...props}
    />
    <span>
      <span className="font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
    </span>
  </label>
));
CheckboxField.displayName = "CheckboxField";
