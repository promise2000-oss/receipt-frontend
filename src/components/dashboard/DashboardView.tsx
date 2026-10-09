"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarRange, Plus, Sun } from "lucide-react";
import { api } from "@/lib/api";
import { formatLongDate, formatMoney } from "@/lib/format";
import type { DashboardSummary } from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
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
  const { session } = useSession();

  useEffect(() => {
    let cancelled = false;
    api.getDashboardSummary().then((value) => {
      if (cancelled) return;
      setSummary(value);
      setTodayLabel(formatLongDate(new Date()));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const heading = todayLabel
    ? `${todayLabel} · ${session?.org_name ?? ""}`.trim()
    : "A quick look at your sales.";

  return (
    <>
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

      {/* ---- Stat cards: black cards, gold numbers ---- */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summary
          ? STAT_BLOCKS.map(({ key, label, icon: Icon }) => {
              const block = summary[key];
              return (
                <div
                  key={key}
                  className="rounded-card border border-brand-gold/25 bg-brand-black p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-cream/55">
                      {label}
                    </span>
                    <Icon className="h-4 w-4 text-brand-gold" strokeWidth={1.8} />
                  </div>
                  <div className="mt-4 text-[26px] font-semibold leading-none tabular-nums text-brand-gold sm:text-[30px]">
                    {formatMoney(block.total)}
                  </div>
                  <div className="mt-2.5 text-xs text-cream/50">
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
          <div className="px-6 py-10 text-center text-sm text-muted">
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
