import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { DashboardView } from "@/components/dashboard/DashboardView";

/**
 * The signed-in dashboard.
 *
 * It lives at `/dashboard` rather than `/` because the site root is now the
 * public marketing page: a crawler arriving at the origin must find content,
 * not an auth wall. Everything inside the app links here.
 *
 * The page itself stays a Server Component purely to own its metadata, which
 * is where the organization-specific browser title is produced.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("Dashboard"),
    description: "Your organization's receipts, invoices and balances.",
    // Private: revenue figures must never reach an index.
  };
}

export default function DashboardPage() {
  return <DashboardView />;
}