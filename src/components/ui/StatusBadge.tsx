import { Ban, CheckCircle2, Clock, Hourglass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PaymentStatus, ReceiptStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export type BadgeTone = PaymentStatus | ReceiptStatus | "voided";

const TONES: Record<
  BadgeTone,
  { label: string; icon: LucideIcon; className: string }
> = {
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    /* Green, deliberately outside the red brand family so "paid" can never
       be mistaken for "error" — and paired with an icon + word, so the
       state survives greyscale and colour-blindness. */
    className: "border-vg-success/45 bg-vg-success/12 text-vg-success",
  },
  partial: {
    label: "Partial",
    icon: Hourglass,
    className: "border-vg-border bg-vg-surface-3 text-vg-text-muted",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "border-vg-warning/45 bg-vg-warning/12 text-vg-warning",
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "border-vg-success/45 bg-vg-success/12 text-vg-success",
  },
  void: {
    label: "Void",
    icon: Ban,
    className: "border-vg-red-900 bg-vg-red-900/12 text-vg-white",
  },
  voided: {
    label: "Voided",
    icon: Ban,
    className: "border-vg-red-900 bg-vg-red-900/12 text-vg-white",
  },
};

/**
 * Pill badge — a tinted outline plus a glyph and a word.
 *
 * Brand red fails contrast as text on every dark surface (2.80–3.10:1), so
 * Void leans on a *red border and fill* with white text rather than red
 * lettering. Status is never carried by colour alone.
 */
export function StatusBadge({
  tone,
  className,
}: {
  tone: BadgeTone;
  className?: string;
}) {
  const { label, icon: Icon, className: toneClass } = TONES[tone];
  const struck = tone === "void" || tone === "voided";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap",
        toneClass,
        struck && "line-through",
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.4} aria-hidden />
      {label}
    </span>
  );
}
