import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import type { Receipt } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Desktop column header — shared by Dashboard + History. */
export function ReceiptTableHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "hidden gap-4 border-b border-brand-gold/15 px-5 py-3 sm:grid sm:grid-cols-[112px_122px_1fr_150px_112px] sm:items-center",
        className,
      )}
      aria-hidden
    >
      {["Date", "Receipt No.", "Customer", "Amount", "Status"].map((label, index) => (
        <span
          key={label}
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted",
            index >= 3 && "text-right",
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * One receipt row — table-like grid on desktop, stacked card line on mobile.
 * Tapping anywhere opens the preview. Void rows are struck through.
 */
export function ReceiptRow({ receipt, currency = "NGN" }: { receipt: Receipt; currency?: string }) {
  const isVoid = receipt.status === "void";

  return (
    <Link
      href={`/receipts/${receipt.receipt_number}`}
      className="block border-b border-brand-gold/10 px-5 py-4 transition-colors last:border-b-0 hover:bg-brand-gold/[0.06] focus-visible:bg-brand-gold/[0.06]"
    >
      {/* Mobile */}
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm font-medium text-ink",
              isVoid && "line-through",
            )}
          >
            {receipt.customer_name}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {receipt.receipt_number} · {formatDate(receipt.issue_date)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "text-sm font-semibold tabular-nums text-ink",
              isVoid && "line-through",
            )}
          >
            {formatMoney(receipt.total, currency)}
          </span>
          <StatusBadge tone={isVoid ? "void" : receipt.payment_status} />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-[112px_122px_1fr_150px_112px] sm:items-center">
        <span className="text-sm text-muted">{formatDate(receipt.issue_date)}</span>
        <span className="text-sm tabular-nums text-ink">{receipt.receipt_number}</span>
        <span
          className={cn(
            "truncate text-sm text-ink",
            isVoid && "line-through",
          )}
        >
          {receipt.customer_name}
        </span>
        <span
          className={cn(
            "text-right text-sm font-semibold tabular-nums text-ink",
            isVoid && "line-through",
          )}
        >
          {formatMoney(receipt.total, currency)}
        </span>
        <span className="flex justify-end">
          <StatusBadge tone={isVoid ? "void" : receipt.payment_status} />
        </span>
      </div>
    </Link>
  );
}
