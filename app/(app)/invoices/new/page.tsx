import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("New Invoice"),
    description: "Bill a customer and start tracking what is owed.",
    // An invoice composer is a private working surface — never indexed.
  };
}

export default function NewInvoicePage() {
  return <InvoiceForm />;
}