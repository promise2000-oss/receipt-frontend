import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { DashboardView } from "@/components/dashboard/DashboardView";

/**
 * The dashboard lives in a client component (it polls the summary API), so the
 * page itself stays a Server Component purely to own its metadata — which is
 * where an organization-specific browser title has to be produced.
 */
export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("Dashboard") };
}

export default function DashboardPage() {
  return <DashboardView />;
}
