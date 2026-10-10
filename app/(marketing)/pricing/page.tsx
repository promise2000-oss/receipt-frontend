import type { Metadata } from "next";
import { Check } from "lucide-react";
import { canonical } from "@/lib/site";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Pricing.
 *
 * One plan, priced at £0, because that is the entire truth today. Publishing
 * a tier table with invented limits and a made-up enterprise tier is the kind
 * of thing the product spec explicitly rules out, and it would also be a lie
 * the page itself could not support.
 *
 * `noindex, follow` while the offering is this simple: there is nothing here
 * for a searcher looking for a plan comparison, and a thin commercial page is
 * a poor thing to rank for. It becomes indexable the day there is a real plan
 * structure to compare — which is the honest trigger, not an arbitrary date.
 */
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "VisionaryGene is free to use today. Create a workspace, issue receipts and invoices, and export branded documents at no cost.",
  alternates: { canonical: canonical("/pricing") },
  robots: { index: false, follow: true },
};

const INCLUDED = [
  "Unlimited receipts and invoices",
  "Unlimited customers",
  "Your logo and brand colours",
  "PDF and high-resolution PNG export",
  "Invoice payments and balance tracking",
  "Team roles — owner, admin, staff, viewer",
  "An audit trail of issued, voided and cancelled documents",
  "Native sharing from your phone",
];

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="Free, and we mean it"
        description="VisionaryGene does not charge anything today. Every capability below is available to every workspace at no cost, and no card is needed to sign up."
      />

      <section aria-labelledby="plan-heading" className="border-b border-vg-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-card border border-vg-border bg-vg-surface-2 p-8">
            <h2
              id="plan-heading"
              className="text-2xl font-semibold tracking-tight text-vg-white"
            >
              VisionaryGene
            </h2>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight text-vg-white">
                £0
              </span>
              <span className="text-sm text-vg-text-muted">
                for as long as the product is free
              </span>
            </p>

            <ul className="mt-8 space-y-3.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-vg-success"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  <span className="text-[15px] leading-relaxed text-vg-text-muted">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <ButtonLink href="/signup" size="lg">
                Create your business account
              </ButtonLink>
            </div>
          </div>

          <div className="mt-8 rounded-card border border-vg-border bg-vg-surface-1 p-6">
            <h3 className="text-sm font-semibold text-vg-white">
              When will it cost anything?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-vg-text-muted">
              If paid plans are introduced, they will be announced on this page
              before anything is charged, and existing free workspaces will keep
              working. This section will be replaced with a real plan comparison
              at that point — there is deliberately no placeholder pricing table
              here, because a table of limits that do not exist would be worse
              than no table.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}