import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { InvoicesView } from "@/components/invoice/InvoicesView";
import type { InvoiceChip } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("Invoices"),
    description: "Searchable history of every invoice you have issued.",
    // Invoice history is a customer's financial data — never indexed.
    robots: { index: false, follow: false },
  };
}

const CHIPS: InvoiceChip[] = [
  "all",
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
];

export default async function InvoicesPage(props: PageProps<"/invoices">) {
  const searchParams = await props.searchParams;

  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const chipParam = typeof searchParams.chip === "string" ? searchParams.chip : null;
  const chip = CHIPS.includes(chipParam as InvoiceChip)
    ? (chipParam as InvoiceChip)
    : "all";

  return <InvoicesView initialQuery={q} initialChip={chip} />;
}