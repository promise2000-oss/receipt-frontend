import Link from "next/link";

/**
 * The feature grid.
 *
 * Each entry links to the page that explains it, so a crawler following a
 * link from here lands on real content rather than an anchor on the same
 * page. Every item describes something implemented today.
 */
const FEATURES = [
  {
    href: "/features/receipts",
    title: "Branded receipts",
    body: "Your logo, colours and business details flow into every receipt, the printable page and the exported PDF. Upload a logo once and it appears everywhere.",
  },
  {
    href: "/features/invoicing",
    title: "Invoices with a lifecycle",
    body: "Save a draft while you get the details right, then issue it to lock the figures. Overdue invoices are identified automatically from the due date.",
  },
  {
    href: "/features/invoicing",
    title: "Payments and balances",
    body: "Record part-payments against an invoice and watch the outstanding balance fall. A receipt is generated for each payment, for the amount actually received.",
  },
  {
    href: "/features/receipts",
    title: "PDF and image export",
    body: "Download a properly branded PDF, or a high-resolution PNG for WhatsApp and social. Both are generated from the same document as the screen preview.",
  },
  {
    href: "/features/receipts",
    title: "Share from your phone",
    body: "Send the document straight to WhatsApp, email or any other app on your device through the native share sheet.",
  },
  {
    href: "/team",
    title: "Team roles",
    body: "Give colleagues exactly the access they need. Owners, admins, staff and viewers each get a different set of permissions, enforced on the server.",
  },
];

export function FeatureGrid() {
  return (
    <section
      aria-labelledby="features-heading"
      className="border-b border-vg-border bg-vg-surface-1"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <h2
          id="features-heading"
          className="text-3xl font-semibold tracking-tight text-vg-white sm:text-4xl"
        >
          Everything you need to bill a customer
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-vg-text-muted">
          Receipts, invoices, payments and exports — in one workspace, with
          your own branding on every document.
        </p>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <Link
                href={feature.href}
                className="flex h-full flex-col rounded-card border border-vg-border bg-vg-surface-2 p-6 transition-colors hover:border-vg-surface-3 hover:bg-vg-row-hover"
              >
                <h3 className="text-lg font-semibold text-vg-white">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-vg-text-muted">
                  {feature.body}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}