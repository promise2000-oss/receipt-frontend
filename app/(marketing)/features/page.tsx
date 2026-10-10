import type { Metadata } from "next";
import { canonical } from "@/lib/site";
import { PageIntro } from "@/components/marketing/PageIntro";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { SecuritySection } from "@/components/marketing/SecuritySection";
import { CtaBand } from "@/components/marketing/CtaBand";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Branded receipts and invoices, part-payment tracking, PDF and image export, native sharing, per-organization branding and team roles.",
  alternates: { canonical: canonical("/features") },
};

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="Everything in one workspace"
        description="Receipts and invoices are different documents with different rules, and VisionaryGene handles both — including the parts that are easy to get wrong: partial payments, document numbering, and making an exported file look like the screen preview did."
      />
      <FeatureGrid />
      <SecuritySection />
      <CtaBand />
    </>
  );
}