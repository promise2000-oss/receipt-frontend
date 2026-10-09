"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Pill chip selector — the selected chip takes the brand red fill with
 * white text; the rest are hairline outlines in muted grey.
 *
 * `aria-checked` already carries the selection to assistive tech, so the
 * state is never signalled by colour alone.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              active
                ? "border-vg-red-900 bg-vg-red-900 text-vg-white"
                : "border-vg-border bg-transparent text-vg-text-muted hover:border-vg-surface-3 hover:bg-vg-surface-3 hover:text-vg-white",
            )}
          >
            {Icon && <Icon className="h-4 w-4" strokeWidth={1.8} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
