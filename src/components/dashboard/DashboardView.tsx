"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarRange, Plus, Sun } from "lucide-react";
import { api, readableError } from "@/lib/api";
import { formatLongDate, formatMoney } from "@/lib/format";
import type { DashboardSummary } from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadError } from "@/components/ui/LoadError";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ReceiptRow, ReceiptTableHeader } from "@/components/receipt/ReceiptRow";
import type { LucideIcon } from "lucide-react";

const STAT_BLOCKS: Array<{
  key: keyof Pick<DashboardSummary, "today" | "week" | "month">;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "today", label: "Today", icon: Sun },
  { key: "week", label: "This Week", icon: CalendarDays },
  { key: "month", label: "This Month", icon: CalendarRange },
];

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todayLabel, setTodayLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Bumped by "Try again" — a failed read should be recoverable in place. */
  const [attempt, setAttempt] = useState(0);
  const { session } = useSession();

  useEffect(() => {
    let cancelled = false;
    api
      .getDashboardSummary()
      .then((value) => {
        if (cancelled) return;
        setSummary(value);
        setTodayLabel(formatLongDate(new Date()));
        setError(null);
      })
      .catch((caught: unknown) => {
        // Rejections used to go unhandled here, leaving the stat cards and the
        // table stuck on their skeletons with nothing to say why.
        if (cancelled) return;
        setError(readableError(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    // An event handler, not an effect: dropping the message here is what makes
    // the skeleton reappear instead of the stale failure.
    setError(null);
    setAttempt((value) => value + 1);
  }

  const heading = todayLabel
    ? `${todayLabel} · ${session?.org_name ?? ""}`.trim()
    : "A quick look at your sales.";

  const header = (
    <PageHeader
      title="Dashboard"
      description={heading}
      actions={
        <ButtonLink href="/receipts/new">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Receipt
        </ButtonLink>
      }
    />
  );

  // Nothing to show *and* no way to get it: say so instead of loading forever.
  // If an earlier read did succeed, its figures stay on screen — stale data
  // beats an error message.
  if (error && !summary) {
    return (
      <>
        {header}
        <Card>
          <LoadError message={error} onRetry={retry} />
        </Card>
      </>
    );
  }

  return (
    <>
      {header}

      {/* ---- Stat cards: large white figure, muted label, accent icon ---- */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summary
          ? STAT_BLOCKS.map(({ key, label, icon: Icon }) => {
              const block = summary[key];
              return (
                <div
                  key={key}
                  className="rounded-card border border-vg-border bg-vg-surface-2 p-5 transition-colors hover:border-vg-red-900 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-vg-text-muted">
                      {label}
                    </span>
                    <Icon
                      className="h-4 w-4 text-vg-orange-red"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  </div>
                  <div className="mt-4 text-[26px] font-semibold leading-none tabular-nums text-vg-white sm:text-[30px]">
                    {formatMoney(block.total)}
                  </div>
                  <div className="mt-2.5 text-xs text-vg-text-muted">
                    {block.count} receipt{block.count === 1 ? "" : "s"} issued
                  </div>
                </div>
              );
            })
          : STAT_BLOCKS.map(({ key }) => <StatCardSkeleton key={key} />)}
      </div>

      {/* ---- Recent receipts ---- */}
      <Card className="mt-6">
        <CardHeader
          title="Recent Receipts"
          description="Your latest issued receipts"
          action={
            <ButtonLink href="/receipts" variant="outline" size="sm">
              View all
            </ButtonLink>
          }
        />
        {!summary ? (
          <TableSkeleton rows={4} />
        ) : summary.recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-vg-text-muted">
            No receipts yet — issue your first one to see it here.
          </div>
        ) : (
          <div>
            <ReceiptTableHeader />
            {summary.recent.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
