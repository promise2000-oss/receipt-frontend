import type { Metadata } from "next";

/**
 * Site-wide identity: the origin, the default title, and the social card.
 *
 * Centralised because `metadataBase` has to be right everywhere and getting it
 * subtly wrong (a relative canonical, an OG image on `localhost`) is invisible
 * in development and only surfaces as broken cards in a shared link.
 *
 * Origin precedence:
 *   1. `SITE_URL` — explicit, and wins everywhere (custom domains, hosts that
 *      are not Vercel, or projects with no system variables set).
 *   2. Vercel's production domain — documented as always set, even on preview
 *      deployments, precisely so links that must point at production survive a
 *      build with no configuration.
 *   3. localhost — development, where the fallback is genuinely correct.
 */
const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const SITE_ORIGIN =
  process.env.SITE_URL?.trim() ||
  (vercelProductionHost
    ? `https://${vercelProductionHost}`
    : "http://localhost:3000");

/** Absolute URL for a path. Used by canonicals, OG tags and the sitemap. */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),

  /**
   * The site name, not a slogan. This is the fallback title for any route that
   * does not set one, and it is what a search result shows when nothing else
   * is available — so it names the product rather than describing it.
   */
  title: {
    default: "VisionaryGene — Receipt & Invoicing Platform",
    /**
     * `%s · VisionaryGene`.
     *
     * A template is what stops two pages competing with the same `<title>`:
     * every public page keeps its own descriptive prefix and the brand is
     * appended. Private pages use `pageTitle()`, which produces
     * "Organization — Receipts" instead, because a customer-facing browser tab
     * should lead with the workspace.
     */
    template: "%s · VisionaryGene",
  },

  description:
    "Create branded receipts and invoices, record payments, and export every document as a watermarked PDF or high-resolution image. Built for businesses that need their paperwork to look right.",

  applicationName: "VisionaryGene",
  generator: "Next.js",

  keywords: [
    "receipt generator",
    "invoice generator",
    "receipt management software",
    "invoice management software",
    "online receipt generator",
    "digital receipt generator",
    "business receipt software",
    "small business invoicing",
    "branded receipts",
  ],

  authors: [{ name: "VisionaryGene" }],
  creator: "VisionaryGene",
  publisher: "VisionaryGene",

  /**
   * Verifying ownership in Google Search Console / Bing Webmaster Tools.
   * Requires adding the matching `<meta name="google-site-verification">` tag
   * or an `app/google-[token].html` file to the deployment — the token below is
   * a placeholder and will not verify anything until it is replaced. See the
   * SEO section of the README for the steps.
   */
  verification: {
    google: "REPLACE_WITH_GOOGLE_SITE_VERIFICATION_TOKEN",
  },

  /**
   * A default social card is better than none: without it a shared link renders
   * as a bare title. `app/opengraph-image.png` (1200×630, the VisionaryGene
   * brand) is picked up automatically from the file convention, so nothing here
   * has to name it — but the dimensions are declared so scrapers that cache on
   * the declared size see a change.
   */
  openGraph: {
    type: "website",
    siteName: "VisionaryGene",
    locale: "en_GB",
    url: SITE_ORIGIN,
    title: "VisionaryGene — Receipt & Invoicing Platform",
    description:
      "Branded receipts and invoices, payment tracking, and watermarked PDF and image export for your business.",
  },

  twitter: {
    card: "summary_large_image",
    title: "VisionaryGene — Receipt & Invoicing Platform",
    description:
      "Branded receipts and invoices, payment tracking, and watermarked PDF and image export for your business.",
  },

  /**
   * `max-image-preview:large` is the current guidance from the Open Graph
   * protocol maintainers; without it some scrapers fall back to a small
   * thumbnail of the card.
   */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  formatDetection: {
    telephone: false,
  },
};

/**
 * Canonical URL for a route.
 *
 * Every indexable page calls this, so the canonical can never disagree with
 * the URL the page is actually served at — a mismatch is one of the easiest
 * ways to deindex a site without noticing.
 */
export function canonical(path: string): string {
  return absoluteUrl(path);
}