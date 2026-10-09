import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Shared control skin. Focus is a single accent border plus a 20%-opacity
 * accent glow (see `.control-focus` in globals.css) rather than an outline,
 * so the whole field reads as lit instead of ringed.
 */
const CONTROL =
  "w-full rounded-control border border-vg-border bg-vg-surface-2 px-3.5 text-[15px] text-vg-white placeholder:text-vg-placeholder transition-colors focus:control-focus focus:outline-none";

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline gap-1 text-[13px] font-medium text-vg-white">
        {label}
        {required && (
          <span className="text-vg-accent-text" aria-hidden>
            *
          </span>
        )}
      </span>
      {children}
      {error ? (
        /* Icon + text, never colour alone. */
        <span className="mt-1.5 flex items-start gap-1.5 text-xs text-vg-error">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-vg-text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  className,
  ...rest
}: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(CONTROL, "h-11", className)} {...rest} />;
}

export function TextArea({
  className,
  ...rest
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(CONTROL, "min-h-24 resize-y py-3 leading-relaxed", className)}
      {...rest}
    />
  );
}

export function SelectInput({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"select">) {
  return (
    <select className={cn(CONTROL, "h-11 cursor-pointer pr-9", className)} {...rest}>
      {children}
    </select>
  );
}
