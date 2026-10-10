import { Ban, CheckCircle2, Clock, Hourglass, PencilLine, TriangleAlert, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InvoiceStatus, PaymentStatus, ReceiptStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | PaymentStatus
  | ReceiptStatus
  | "voided"
  | InvoiceStatus
  | "success"
  | "error"
  | "warning"
  | "muted";

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

  /* ---- Invoice lifecycle ---- */
  draft: {
    label: "Draft",
    icon: PencilLine,
    className: "border-vg-border bg-vg-surface-3 text-vg-text-muted",
  },
  issued: {
    label: "Issued",
    icon: Clock,
    className: "border-vg-warning/45 bg-vg-warning/12 text-vg-warning",
  },
  partially_paid: {
    label: "Partially Paid",
    icon: Hourglass,
    className: "border-vg-warning/45 bg-vg-warning/12 text-vg-warning",
  },
  overdue: {
    label: "Overdue",
    icon: TriangleAlert,
    /* Error red with white text — the only tone that reads as a problem. */
    className: "border-vg-error bg-vg-error/20 text-vg-error",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "border-vg-red-900 bg-vg-red-900/12 text-vg-white",
  },

  /* Generic aliases, so a caller can express intent rather than a domain
     enum when the same visual treatment applies. */
  success: {
    label: "Paid",
    icon: CheckCircle2,
    className: "border-vg-success/45 bg-vg-success/12 text-vg-success",
  },
  error: {
    label: "Overdue",
    icon: TriangleAlert,
    className: "border-vg-error bg-vg-error/20 text-vg-error",
  },
  warning: {
    label: "Pending",
    icon: Clock,
    className: "border-vg-warning/45 bg-vg-warning/12 text-vg-warning",
  },
  muted: {
    label: "Draft",
    icon: PencilLine,
    className: "border-vg-border bg-vg-surface-3 text-vg-text-muted",
  },
};

/**
 * Pill badge — a tinted outline plus a glyph and a word.
 *
 * Brand red fails contrast as text on every dark surface (2.80–3.10:1), so
 * Void leans on a *red border and fill* with white text rather than red
 * lettering. Status is never carried by colour alone.
 *
 * `label` overrides the tone's default word. Invoice states share the receipt
 * tones, so the override is what lets "Draft" and "Issued" read correctly
 * without duplicating the whole palette.
 */
export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: BadgeTone;
  label?: string;
  className?: string;
}) {
  const tone_ = TONES[tone];
  const Icon = tone_.icon;
  const struck = tone === "void" || tone === "voided";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap",
        tone_.className,
        struck && "line-through",
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.4} aria-hidden />
      {label ?? tone_.label}
    </span>
  );
}