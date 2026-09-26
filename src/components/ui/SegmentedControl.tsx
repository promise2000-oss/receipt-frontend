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
 * Pill chip selector — active chip is black with gold text,
 * inactive chips are thin gold outlines.
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
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              active
                ? "border-brand-black bg-brand-black text-brand-gold"
                : "border-brand-gold/30 bg-transparent text-muted hover:border-brand-gold hover:text-ink",
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
