import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { ReceiptPreview } from "@/components/receipt/ReceiptPreview";

export async function generateMetadata(
  props: PageProps<"/receipts/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  return {
    title: await pageTitle(`Receipt ${id}`),
    description: `Preview, share, or download receipt ${id}.`,
  };
}

export default async function ReceiptPage(props: PageProps<"/receipts/[id]">) {
  const { id } = await props.params;
  return <ReceiptPreview id={id} />;
}
