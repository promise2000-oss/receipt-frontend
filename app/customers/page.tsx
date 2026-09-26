import type { Metadata } from "next";
import { CustomersView } from "@/components/customers/CustomersView";

export const metadata: Metadata = {
  title: "Customers",
  description: "Your saved customers and their receipt history.",
};

export default function CustomersPage() {
  return <CustomersView />;
}
