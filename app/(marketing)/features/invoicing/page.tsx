import type { Metadata } from "next";
import { Check } from "lucide-react";
import { canonical } from "@/lib/site";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Invoicing",
  description:
    "Create invoices, record part-payments, and let the outstanding balance and overdue status track themselves. Every payment generates a matching receipt.",
  alternates: { canonical: canonical("/features/invoicing") },
};

const LIFECYCLE = [
  {
    status: "Draft",
    body: "Save it while you get the figures right. A draft stays editable — nothing has been promised to a customer yet.",
  },
  {
    status: "Issued",
    body: "Issuing assigns the invoice number and locks the figures. From here it behaves like the receipt a customer would keep.",
  },
  {
    status: "Partially paid",
    body: "Record what has arrived and the balance falls automatically. A receipt is generated for each payment, for the amount actually received.",
  },
  {
    status: "Paid",
    body: "The invoice has been settled in full. Both the invoice and every payment receipt remain in your history.",
  },
  {
    status: "Overdue",
    body: "Issued, unpaid, and past its due date. Identified automatically from the date rather than by a manual status change.",
  },
];

export default function InvoicesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Invoicing"
        title="Bill a customer now, get paid over time"
        description="An invoice is not a receipt with a different title. It has a due date, a balance, and a payment history — and getting any of those wrong is how businesses end up chasing money they were owed."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/signup" size="lg">
            Create your workspace
          </ButtonLink>
          <ButtonLink href="/features/receipts" size="lg" variant="outline">
            Need a simple receipt instead?
          </ButtonLink>
        </div>
      </PageIntro>

      <section aria-labelledby="lifecycle-heading" className="border-b border-vg-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="lifecycle-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            What an invoice can be
          </h2>
          <dl className="mt-10 space-y-6">
            {LIFECYCLE.map((state) => (
              <div
                key={state.status}
                className="rounded-card border border-vg-border bg-vg-surface-2 p-6"
              >
                <dt className="text-lg font-semibold text-vg-white">
                  {state.status}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-vg-text-muted">
                  {state.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="payments-heading"
        className="border-b border-vg-border bg-vg-surface-1"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="payments-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            Part-payments work the way you would expect
          </h2>
          <p className="mt-4 leading-relaxed text-vg-text-muted">
            Record a deposit, then the balance later. Each payment is stored
            with its amount, date, method and reference, and the outstanding
            balance is always the invoice total minus what has actually been
            received.
          </p>
          <ul className="mt-8 space-y-3.5">
            {[
              "A payment larger than the outstanding balance is refused, not silently trimmed",
              "Two payments recorded at the same instant cannot overspend the invoice",
              "Every payment generates a receipt, so the customer gets a document for the money that arrived",
              "Amounts are calculated on the server — the figures on screen match the document",
            ].map((item) => (
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

      <CtaBand />
    </>
  );
}