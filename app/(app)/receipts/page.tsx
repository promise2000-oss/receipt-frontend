import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { HistoryView } from "@/components/history/HistoryView";
import type { ReceiptChip } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("Receipts"),
    description: "Searchable history of every receipt you have issued.",
  };
}

const CHIPS: ReceiptChip[] = ["all", "paid", "partial", "pending", "void"];
const PERIODS = ["all", "today", "week", "month"] as const;

export default async function ReceiptsPage(props: PageProps<"/receipts">) {
  const searchParams = await props.searchParams;

  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const chipParam = typeof searchParams.chip === "string" ? searchParams.chip : null;
  const periodParam =
    typeof searchParams.period === "string" ? searchParams.period : null;

  const chip = CHIPS.includes(chipParam as ReceiptChip)
    ? (chipParam as ReceiptChip)
    : "all";
  const period = PERIODS.includes(periodParam as (typeof PERIODS)[number])
    ? (periodParam as (typeof PERIODS)[number])
    : "all";

  return <HistoryView initialQuery={q} initialChip={chip} initialPeriod={period} />;
}
