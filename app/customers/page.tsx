import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { CustomersView } from "@/components/customers/CustomersView";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("Customers"),
    description: "Your saved customers and their receipt history.",
  };
}

export default function CustomersPage() {
  return <CustomersView />;
}
