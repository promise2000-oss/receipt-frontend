"use client";

import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { api, readableError } from "@/lib/api";
import type { Receipt, ReceiptChip } from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadError } from "@/components/ui/LoadError";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SelectInput } from "@/components/ui/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ReceiptRow, ReceiptTableHeader } from "@/components/receipt/ReceiptRow";

const CHIP_OPTIONS: Array<{ value: ReceiptChip; label: string }> = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
  { value: "void", label: "Void" },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

interface HistoryViewProps {
  initialQuery: string;
  initialChip: ReceiptChip;
  initialPeriod: (typeof PERIOD_OPTIONS)[number]["value"];
}

/**
 * Identifies the filter set a request was for.
 *
 * Failures are tagged with this so that editing a filter hides a failure that
 * is no longer about what is on screen. Clearing on input change instead would
 * mean remembering to do it in all five handlers, including any that arrive
 * from the URL later.
 */
function filterKey(query: string, chip: ReceiptChip, period: string): string {
  return `${query}|${chip}|${period}`;
}

export function HistoryView({
  initialQuery,
  initialChip,
  initialPeriod,
}: HistoryViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [chip, setChip] = useState<ReceiptChip>(initialChip);
  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]["value"]>(
    initialPeriod,
  );
  const [receipts, setReceipts] = useState<Receipt[] | null>(null);
  /** The last failure, tagged with the filters it belongs to. */
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  /** Bumped by "Try again" — a failed read should be recoverable in place. */
  const [attempt, setAttempt] = useState(0);
  /** Currency comes from the session's organization — no second fetch. */
  const business = useSession().session?.business ?? null;

  useEffect(() => {
    let cancelled = false;
    const key = filterKey(query, chip, period);
    api
      .getReceipts({ q: query, chip, period })
      .then((value) => {
        if (!cancelled) {
          setReceipts(value);
          setFailure(null);
        }
      })
      .catch((caught: unknown) => {
        // An unhandled rejection left this table on its skeleton forever, so a
        // dropped connection read as a search that never finished.
        if (cancelled) return;
        setFailure({ key, message: readableError(caught) });
      });
    return () => {
      cancelled = true;
    };
  }, [query, chip, period, attempt]);

  function retry() {
    // An event handler, not an effect: dropping the message here is what makes
    // the skeleton reappear instead of the stale failure.
    setFailure(null);
    setAttempt((value) => value + 1);
  }

  /** A failure is only shown while the filters it was raised under still apply. */
  const error =
    failure && failure.key === filterKey(query, chip, period)
      ? failure.message
      : null;

  const filtersActive = query.trim() !== "" || chip !== "all" || period !== "all";

  function clearFilters() {
    setQuery("");
    setChip("all");
    setPeriod("all");
  }

  return (
    <>
      <PageHeader
        title="Receipts"
        description="Search, filter, and re-open any receipt you've issued."
        actions={
          <ButtonLink href="/receipts/new">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Receipt
          </ButtonLink>
        }
      />

      {/* ---- Filters ---- */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vg-text-muted"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Customer, receipt no. or amount…"
              aria-label="Search receipts"
              className="h-11 w-full rounded-control border border-vg-border bg-vg-surface-2 pl-10 pr-9 text-[15px] text-vg-white transition-colors placeholder:text-vg-placeholder focus:control-focus focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-vg-text-muted transition-colors hover:bg-vg-surface-3 hover:text-vg-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>

          <SelectInput
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as (typeof PERIOD_OPTIONS)[number]["value"])
            }
            aria-label="Filter by date"
            className="sm:w-44"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            options={CHIP_OPTIONS}
            value={chip}
            onChange={setChip}
            ariaLabel="Filter by status"
          />
          <span className="text-xs text-vg-text-muted" aria-live="polite">
            {error
              ? "Couldn't load"
              : receipts
                ? `${receipts.length} receipt${receipts.length === 1 ? "" : "s"}`
                : "Loading…"}
          </span>
        </div>
      </div>

      {/* ---- Results ---- */}
      <Card>
        <CardBody padded={false}>
          {/* The failure replaces the table rather than sitting beside it: the
              rows still showing are for the filter that just failed, so they
              read as an answer to the query now in the box. */}
          {error ? (
            <LoadError message={error} onRetry={retry} />
          ) : !receipts ? (
            <TableSkeleton rows={6} />
          ) : receipts.length === 0 ? (
            filtersActive ? (
              <EmptyState
                title="No matching receipts"
                description="Try a different search term, or clear the filters to see everything again."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No receipts yet"
                description="Once you issue your first receipt it will live here — searchable, shareable, and always on-brand."
                action={
                  <ButtonLink href="/receipts/new">
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Create your first receipt
                  </ButtonLink>
                }
              />
            )
          ) : (
            <>
              <ReceiptTableHeader />
              {receipts.map((receipt) => (
                <ReceiptRow
                  key={receipt.id}
                  receipt={receipt}
                  currency={business?.currency ?? "NGN"}
                />
              ))}
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
}
