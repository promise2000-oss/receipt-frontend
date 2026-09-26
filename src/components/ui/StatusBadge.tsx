import type { PaymentStatus, ReceiptStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export type BadgeTone = PaymentStatus | ReceiptStatus | "voided";

const TONES: Record<BadgeTone, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "border-brand-gold/40 bg-brand-gold/15 text-gold-deep",
  },
  partial: {
    label: "Partial",
    className: "border-brand-black/25 bg-brand-black/8 text-ink",
  },
  pending: {
    label: "Pending",
    className: "border-muted/40 bg-transparent text-muted",
  },
  active: {
    label: "Active",
    className: "border-brand-gold/40 bg-brand-gold/15 text-gold-deep",
  },
  void: {
    label: "Void",
    className: "border-muted/35 bg-muted/10 text-muted line-through",
  },
  voided: {
    label: "Voided",
    className: "border-muted/35 bg-muted/10 text-muted line-through",
  },
};

/**
 * Pill badge — subtle background tint of its colour, never a solid fill.
 * Paid = gold tint · Pending = grey outline · Void = muted + strikethrough.
 */
export function StatusBadge({
  tone,
  className,
}: {
  tone: BadgeTone;
  className?: string;
}) {
  const { label, className: toneClass } = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]",
        toneClass,
        className,
      )}
    >
      {tone === "paid" && (
        <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden />
      )}
      {label}
    </span>
  );
}
