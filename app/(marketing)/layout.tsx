import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

/**
 * The public marketing shell.
 *
 * A server component that renders the whole page as static HTML — no client
 * provider, no auth gate, no data fetching. That is what makes these routes
 * crawlable and fast: a crawler receives the finished document in the first
 * response rather than an empty shell it would have to execute to read.
 *
 * The signed-in application lives in the sibling `(app)` group, which has its
 * own layout and chrome, so neither surface has to know about the other.
 */

/** The public navigation, shared by the header and the footer. */
export const MARKETING_NAV = [
  { href: "/features", label: "Features" },
  { href: "/features/receipts", label: "Receipts" },
  { href: "/features/invoicing", label: "Invoicing" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export default function MarketingLayout({
  children,
  activePath = "/",
}: {
  children: React.ReactNode;
  /** Which nav item is current. Each page passes its own path. */
  activePath?: string;
}) {
  return (
    <div className="app-bg flex min-h-dvh flex-col">
      <MarketingHeader nav={MARKETING_NAV} activePath={activePath} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter nav={MARKETING_NAV} />
    </div>
  );
}