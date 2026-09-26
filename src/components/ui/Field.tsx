import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-control border border-brand-gold/25 bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/55 transition-colors focus:border-brand-gold";

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
      <span className="mb-1.5 flex items-baseline gap-1 text-[13px] font-medium text-ink">
        {label}
        {required && <span className="text-brand-gold">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-gold-deep">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
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
