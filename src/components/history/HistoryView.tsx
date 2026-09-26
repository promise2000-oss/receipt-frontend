"use client";

import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Business, Receipt, ReceiptChip } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
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
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    api.getBusiness().then(setBusiness);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getReceipts({ q: query, chip, period }).then((value) => {
      if (!cancelled) setReceipts(value);
    });
    return () => {
      cancelled = true;
    };
  }, [query, chip, period]);

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
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold"
              strokeWidth={2}
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Customer, receipt no. or amount…"
              aria-label="Search receipts"
              className="h-11 w-full rounded-control border border-brand-gold/25 bg-white pl-10 pr-9 text-[15px] text-ink transition-colors placeholder:text-muted/55 focus:border-brand-gold"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-brand-gold/10 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
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
          <span className="text-xs text-muted" aria-live="polite">
            {receipts
              ? `${receipts.length} receipt${receipts.length === 1 ? "" : "s"}`
              : "Loading…"}
          </span>
        </div>
      </div>

      {/* ---- Results ---- */}
      <Card>
        <CardBody padded={false}>
          {!receipts ? (
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
