import type { Metadata } from "next";
import { canonical } from "@/lib/site";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { SecuritySection } from "@/components/marketing/SecuritySection";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FAQSection } from "@/components/marketing/FAQSection";
import { RedirectSignedInUsers } from "@/components/marketing/RedirectSignedInUsers";

/**
 * The public homepage.
 *
 * Every claim here describes something the product actually does today —
 * there is no invented testimonial, customer count or feature. Each section
 * maps to a route or an implemented capability, and the pricing page carries
 * the honest caveat that it is not yet charging.
 *
 * The JSON-LD below describes the *product* only. Aggregate ratings, review
 * counts and offers are deliberately absent: inventing them would be both
 * dishonest and a structured-data violation.
 */
export const metadata: Metadata = {
  title: "Receipt & Invoicing Software for Your Business",
  description:
    "Create branded receipts and invoices, record payments against them, and export every document as a watermarked PDF or a high-resolution image. Free to start.",
  alternates: { canonical: canonical("/") },
  openGraph: {
    url: canonical("/"),
    title: "VisionaryGene — Receipt & Invoicing Software for Your Business",
    description:
      "Branded receipts and invoices, payment tracking, and watermarked PDF and image export for your business.",
  },
};

/** JSON-LD, emitted server-side so no client JavaScript is needed to read it. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://visionarygene.com/#organization",
      name: "VisionaryGene",
      url: "https://visionarygene.com",
      slogan: "Future Intelligence Vision.",
      description:
        "Provider of receipt and invoicing software for small businesses.",
    },
    {
      "@type": "WebSite",
      "@id": "https://visionarygene.com/#website",
      url: "https://visionarygene.com",
      name: "VisionaryGene",
      publisher: { "@id": "https://visionarygene.com/#organization" },
      inLanguage: "en",
    },
    {
      /**
       * `SoftwareApplication` with `offers` — the price is genuinely £0 today,
       * so this is accurate rather than aspirational. No `aggregateRating`,
       * because the product has no published reviews and inventing them would
       * be a structured-data violation Google penalises.
       */
      "@type": "SoftwareApplication",
      "@id": "https://visionarygene.com/#app",
      name: "VisionaryGene",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Multi-tenant receipt and invoicing software with payment tracking, branded PDF and image export, and tenant-separated data.",
      publisher: { "@id": "https://visionarygene.com/#organization" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        "Branded receipts and invoices",
        "Invoice payment tracking",
        "Partial payments",
        "PDF and PNG document export",
        "Native mobile sharing",
        "Organization branding",
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, developer-authored JSON — not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <RedirectSignedInUsers />
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <SecuritySection />
      <FAQSection />
      <CtaBand />
    </>
  );
}