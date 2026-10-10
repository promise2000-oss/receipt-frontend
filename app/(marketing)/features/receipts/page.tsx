import type { Metadata } from "next";
import { Check } from "lucide-react";
import { canonical } from "@/lib/site";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Receipts",
  description:
    "Issue branded receipts in under a minute. Add your logo and colours, print or export a watermarked PDF, and share it from your phone.",
  alternates: { canonical: canonical("/features/receipts") },
};

const CAPABILITIES = [
  "Your logo and brand colours on every receipt",
  "Line items with quantities and unit prices",
  "Discounts, and the total calculated on the server",
  "A QR code a customer can scan to verify the receipt is genuine",
  "Sequential, per-organization receipt numbers that never repeat",
  "Corrections by voiding and reissuing, so the original is never edited",
  "Export as a watermarked PDF or a print-sharp PNG",
  "Share through WhatsApp, email or your device's native share sheet",
];

export default function ReceiptsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Receipts"
        title="A receipt that looks like it came from a real company"
        description="Most receipt tools produce a plain slip. VisionaryGene puts your logo, your colours and your business details on the document — on screen, on paper, and in the file you send."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/signup" size="lg">
            Create your workspace
          </ButtonLink>
          <ButtonLink href="/features/invoicing" size="lg" variant="outline">
            Billing over time? See invoicing
          </ButtonLink>
        </div>
      </PageIntro>

      <section aria-labelledby="capabilities-heading" className="border-b border-vg-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="capabilities-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            What every receipt includes
          </h2>
          <ul className="mt-8 space-y-3.5">
            {CAPABILITIES.map((item) => (
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
        </div>
      </section>

      <section aria-labelledby="immutable-heading" className="border-b border-vg-border bg-vg-surface-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="immutable-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            Issued receipts are never edited
          </h2>
          <p className="mt-4 leading-relaxed text-vg-text-muted">
            Once a receipt has been given to a customer, changing it would
            quietly rewrite what they were told. VisionaryGene freezes a
            receipt the moment it is issued, and the only correction is to void
            it with a recorded reason and issue a replacement that links back to
            the original. The voided receipt stays in your history, struck
            through, so your records still add up.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}