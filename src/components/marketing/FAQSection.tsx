/**
 * FAQ, marked up as a real FAQPage.
 *
 * The answers are deliberately concrete — what is included, what it costs, what
 * happens to the data — rather than vague reassurance. The schema type is only
 * valid for content that is genuinely visible on the page, and every question
 * here is rendered in the same order as the markup.
 */
const FAQS = [
  {
    question: "What does VisionaryGene do?",
    answer:
      "It is receipt and invoicing software. You create receipts and invoices for your business, record payments against invoices, and export any document as a branded PDF or a high-resolution image.",
  },
  {
    question: "Do I need to pay anything to start?",
    answer:
      "No. Creating a workspace and issuing documents is free, and you do not need a card to sign up. Paid plans, if and when they launch, will be announced on the pricing page before anything is charged.",
  },
  {
    question: "Can I put my own logo and colours on the documents?",
    answer:
      "Yes. Upload your logo and set your brand colours in settings, and they are applied to the receipt and invoice headers, the totals block, the printable page and every exported PDF and image.",
  },
  {
    question: "Can I bill a customer and take payment over time?",
    answer:
      "Yes. Create an invoice, issue it, and record payments as they arrive. Part-payments are supported: the outstanding balance falls as you record each one, and a receipt is generated for the amount actually received.",
  },
  {
    question: "Can I send a receipt to my customer from my phone?",
    answer:
      "Yes. Every document can be downloaded as a PDF or a high-resolution PNG, and shared through your device's native share sheet to WhatsApp, email or any other app you have installed.",
  },
  {
    question: "Can my staff use it without seeing everything?",
    answer:
      "Yes. Owners, admins, staff and viewers each get a different set of permissions, enforced by the server on every request. For example a staff member can issue receipts and record payments but cannot change your organization's settings.",
  },
  {
    question: "Can another customer see my business's data?",
    answer:
      "No. Every document is scoped to the organization that created it, and that separation is enforced in the database access layer rather than in the interface. One workspace cannot read another's records.",
  },
];

export function FAQSection() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section aria-labelledby="faq-heading" className="border-b border-vg-border">
      <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
        <h2
          id="faq-heading"
          className="text-3xl font-semibold tracking-tight text-vg-white sm:text-4xl"
        >
          Common questions
        </h2>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <div className="mt-10 space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-card border border-vg-border bg-vg-surface-2"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium text-vg-white">
                {faq.question}
                <span
                  aria-hidden
                  className="shrink-0 text-vg-text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-vg-text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}