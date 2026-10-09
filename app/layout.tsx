import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { SessionProvider } from "@/components/auth/SessionProvider";

/**
 * One geometric sans for the whole product. The old cream/gold build also
 * loaded Playfair Display for headings and the wordmark; the VisionaryGene
 * palette calls for a single type family, so the serif is gone and every
 * `font-display` has been folded into the sans stack.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Absolute origin used to resolve the URL-based metadata fields — chiefly the
 * `opengraph-image` in `app/`, which social scrapers need fully qualified and
 * cannot reach at `localhost`.
 *
 * Precedence:
 *   1. `SITE_URL` — explicit, and wins everywhere (custom domains, hosts that
 *      are not Vercel, or projects that have not enabled system variables).
 *   2. Vercel's production domain — documented as always set, even on preview
 *      deployments, precisely so links that must point at production (OG-image
 *      URLs being the named example) survive a build with no configuration.
 *   3. localhost — development, where the fallback is genuinely correct.
 */
const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

const siteOrigin =
  process.env.SITE_URL?.trim() ||
  (vercelProductionHost
    ? `https://${vercelProductionHost}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "VisionaryGene — Receipt Platform",
    // Each route composes its own full title (see `pageTitle`), so the
    // template adds nothing by default — signed-out pages append the platform
    // themselves and signed-in pages lead with the organization's name.
    template: "%s",
  },
  description:
    "Create, share, and track beautifully branded receipts for your organization — in under a minute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh flex flex-col">
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
