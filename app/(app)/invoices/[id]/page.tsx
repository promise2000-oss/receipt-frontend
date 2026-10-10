import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";

export async function generateMetadata(
  props: PageProps<"/invoices/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  return {
    title: await pageTitle(`Invoice ${id}`),
    description: "Preview, share, or export this invoice.",
    // A specific customer's document. Must never appear in a search index,
    // and must never leak the reference into a public metadata surface.
  };
}

export default async function InvoicePage(props: PageProps<"/invoices/[id]">) {
  const { id } = await props.params;
  return <InvoicePreview id={id} />;
}