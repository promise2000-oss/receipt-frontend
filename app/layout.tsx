import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_ORIGIN, siteMetadata } from "@/lib/site";

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
 * The document shell for *every* route, public and private.
 *
 * Note what is deliberately absent: the app chrome and the session provider.
 * Those live in the `(app)` group so a crawler fetching the marketing pages
 * receives plain HTML with no client-side auth gate in front of it — the single
 * most important thing for this page set to be indexable.
 *
 * `metadataBase` here is what lets every route emit absolute canonical and
 * Open Graph URLs. Social scrapers cannot resolve a relative URL, and a
 * relative canonical is silently ignored.
 */
export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh flex flex-col">
        {children}
      </body>
    </html>
  );
}

export { SITE_ORIGIN };