import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("New Receipt"),
    description: "Create and issue a branded receipt in under a minute.",
  };
}

export default async function NewReceiptPage(
  props: PageProps<"/receipts/new">,
) {
  const searchParams = await props.searchParams;

  const duplicate =
    typeof searchParams.duplicate === "string" ? searchParams.duplicate : null;
  const customerId =
    typeof searchParams.customer === "string" ? searchParams.customer : null;

  return (
    <ReceiptForm duplicateOf={duplicate} prefillCustomerId={customerId} />
  );
}
