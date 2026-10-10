"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ReceiptText, Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import {
  INVOICE_STATUS_LABELS,
  type Invoice,
  type InvoiceChip,
} from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { HistorySkeleton } from "@/components/ui/Skeleton";

/**
 * Invoice history.
 *
 * Structured like `HistoryView` for receipts so the two feel like one
 * product: same search, same filter chips, same empty and error states.
 *
 * Two things are deliberately *not* here: a client-side total, and a
 * client-computed status. Both come from the API, because an invoice balance
 * that disagrees with the document a customer has already been sent is worse
 * than no number at all.
 */

const CHIPS: Array<{ value: InvoiceChip; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "partially_paid", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export function InvoicesView({
  initialQuery,
  initialChip,
}: {
  initialQuery?: string;
  initialChip?: InvoiceChip;
}) {
  const currency = useSession().session?.business.currency ?? "NGN";

  const [query, setQuery] = useState(initialQuery ?? "");
  const [chip, setChip] = useState<InvoiceChip>(initialChip ?? "all");
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<{
    invoiced: number;
    outstanding: number;
    overdue: number;
  } | null>(null);

  /**
   * Filters live in the URL, and the list is refetched whenever they change.
   *
   * The "loading" reset is derived rather than assigned in the effect body:
   * React 19's compiler flags a synchronous `setState` inside an effect as a
   * cascading render, and here it would be redundant anyway — the effect
   * already keys off the same values that decide whether to show a skeleton.
   */
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const currentKey = `${query}|${chip}`;
  const loading = loadedKey !== currentKey;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [list, summary] = await Promise.all([
          api.getInvoices({ q: query, chip }),
          api.getInvoiceSummary(),
        ]);
        if (cancelled) return;
        setInvoices(list);
        setTotals(summary.totals);
        setError(null);
        setLoadedKey(currentKey);
      } catch (caught) {
        if (cancelled) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Something went wrong loading your invoices.",
        );
        // Marking the key as loaded stops the skeleton spinning forever on a
        // genuine failure — the error state replaces it instead.
        setLoadedKey(currentKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, chip, currentKey]);

  if (error) {
    return (
      <EmptyState
        title="Couldn't load your invoices"
        description={error}
        action={
          <ButtonLink href="/dashboard" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Everything you've billed, and what's still owed."
        actions={
          <ButtonLink href="/invoices/new">
            <ReceiptText className="h-4 w-4" strokeWidth={2} />
            New Invoice
          </ButtonLink>
        }
      />

      {/* ---- Real figures from the API ---- */}
      {totals && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Invoiced", value: totals.invoiced, tone: "text-vg-white" },
            { label: "Outstanding", value: totals.outstanding, tone: "text-vg-white" },
            { label: "Overdue", value: totals.overdue, tone: "text-vg-warning" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardBody>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vg-text-muted">
                  {stat.label}
                </div>
                <div className={`mt-1.5 text-lg font-semibold tabular-nums sm:text-xl ${stat.tone}`}>
                  {formatMoney(stat.value, currency)}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Filters ---- */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vg-text-muted"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by invoice number, customer or item…"
            aria-label="Search invoices"
            className="h-12 w-full rounded-control border border-vg-border bg-vg-surface-2 pl-10 pr-4 text-[15px] text-vg-white placeholder:text-vg-text-muted focus:border-vg-accent focus:outline-none"
          />
        </div>
        <SegmentedControl
          options={CHIPS}
          value={chip}
          onChange={setChip}
          ariaLabel="Filter invoices by status"
        />
      </div>

      {/* ---- List ---- */}
      {loading ? (
        <HistorySkeleton />
      ) : invoices === null || invoices.length === 0 ? (
        <EmptyState
          title={query || chip !== "all" ? "No invoices match" : "No invoices yet"}
          description={
            query || chip !== "all"
              ? "Try a different search or filter."
              : "Create your first invoice to bill a customer and start tracking what's owed."
          }
          action={
          <ButtonLink href="/invoices/new">
            <ReceiptText className="h-4 w-4" />
            New Invoice
          </ButtonLink>
        }
      />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-card border border-vg-border md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-vg-surface-1">
                <tr>
                  {["Invoice", "Customer", "Issued", "Due", "Total", "Balance", "Status"].map(
                    (heading, index) => (
                      <th
                        key={heading}
                        className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-vg-text-muted ${
                          index >= 4 ? "text-right" : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-t border-vg-border bg-vg-surface-2 transition-colors hover:bg-vg-row-hover"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/invoices/${invoice.invoice_number}`}
                        className="font-medium text-vg-white hover:text-vg-accent-text"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-vg-text-muted">
                      {invoice.customer_name}
                    </td>
                    <td className="px-4 py-3.5 text-vg-text-muted">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-4 py-3.5 text-vg-text-muted">
                      {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-vg-white">
                      {formatMoney(invoice.total, currency)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-vg-white">
                      {formatMoney(invoice.balance_due, currency)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        label={INVOICE_STATUS_LABELS[invoice.status]}
                        tone={invoiceTone(invoice.status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.invoice_number}`}
                  className="block rounded-card border border-vg-border bg-vg-surface-2 p-4 transition-colors hover:bg-vg-row-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-vg-white">
                        {invoice.invoice_number}
                      </div>
                      <div className="mt-0.5 truncate text-sm text-vg-text-muted">
                        {invoice.customer_name}
                      </div>
                    </div>
                    <StatusBadge
                      label={INVOICE_STATUS_LABELS[invoice.status]}
                      tone={invoiceTone(invoice.status)}
                    />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div className="text-xs text-vg-text-muted">
                      Issued {formatDate(invoice.issue_date)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums text-vg-white">
                        {formatMoney(invoice.total, currency)}
                      </div>
                      {invoice.balance_due > 0 && invoice.status !== "cancelled" && (
                        <div className="text-xs tabular-nums text-vg-text-muted">
                          {formatMoney(invoice.balance_due, currency)} due
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/**
 * Status colour is never the only signal — every badge carries a word too —
 * but the hues are pulled out of the brand family so a state is never
 * mistaken for the product's own branding.
 */
function invoiceTone(status: Invoice["status"]) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "overdue":
      return "error" as const;
    case "partially_paid":
    case "issued":
      return "warning" as const;
    case "cancelled":
      return "muted" as const;
    default:
      return "muted" as const;
  }
}