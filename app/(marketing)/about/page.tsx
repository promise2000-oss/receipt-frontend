import type { Metadata } from "next";
import { canonical } from "@/lib/site";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";

export const metadata: Metadata = {
  title: "About",
  description:
    "VisionaryGene builds receipt and invoicing software for small businesses that need their paperwork to look right. Future Intelligence Vision.",
  alternates: { canonical: canonical("/about") },
};

const PRINCIPLES = [
  {
    title: "The document is the product",
    body: "A receipt is not a row in a database with a print button. It is something a customer keeps, a shopkeeper files, or an accountant reconciles. If the exported file does not look right, nothing else matters.",
  },
  {
    title: "Money is calculated on the server",
    body: "Totals, balances and payment status are never taken from a browser. The figures a customer sees are the same figures that were stored, because they were computed once, in one place, by code we can point at.",
  },
  {
    title: "Correct is a feature",
    body: "Sequential numbering that cannot collide under load, invoices that cannot be edited once issued, payments that cannot overspend an invoice, and tenant boundaries enforced below the application layer rather than in the interface.",
  },
  {
    title: "Say what is true",
    body: "No invented testimonials, no made-up customer counts, no badges for certifications nobody has checked. If a capability is not built, this site does not claim it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="Receipts and invoices, done properly"
        description="VisionaryGene is a receipt and invoicing platform for small businesses — the kind that issue a receipt for every sale and invoice the ones they have to chase."
      />

      <section aria-labelledby="what-heading" className="border-b border-vg-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="what-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            What we are trying to do
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-vg-text-muted">
            <p>
              Most receipt tools do one thing: take some line items, add them
              up, and print them on a plain page. That is genuinely useful, and
              for a single cash sale it is all anyone needs.
            </p>
            <p>
              It stops being enough the moment a business takes a deposit, bills
              a customer who pays over time, or hands a colleague access. At
              that point the hard part is no longer the arithmetic — it is
              making sure the document you sent is the document you meant to
              send, that the money has not been double-counted, and that the
              person who issued it did not have the authority to do so.
            </p>
            <p>
              VisionaryGene is built around those cases. Receipts stay
              immutable and are corrected by voiding and reissuing. Invoices
              carry a real lifecycle and a real balance. Every payment generates
              its own document in the same transaction. And every record belongs
              to exactly one organization, enforced where it cannot be bypassed
              from the browser.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="principles-heading"
        className="border-b border-vg-border bg-vg-surface-1"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="principles-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            How we build it
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <li
                key={principle.title}
                className="rounded-card border border-vg-border bg-vg-surface-2 p-6"
              >
                <h3 className="text-lg font-semibold text-vg-white">
                  {principle.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-vg-text-muted">
                  {principle.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="brand-heading" className="border-b border-vg-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="brand-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            The name
          </h2>
          <p className="mt-4 leading-relaxed text-vg-text-muted">
            VisionaryGene operates this platform. Every receipt and invoice it
            generates carries a faint diagonal watermark identifying it — which
            your own organization can re-word or switch off in settings, because
            the document belongs to you.
          </p>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-vg-accent-text">
            Future Intelligence Vision.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}