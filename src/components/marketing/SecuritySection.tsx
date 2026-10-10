import { ShieldCheck, Building2, Users } from "lucide-react";

/**
 * Security and tenant separation.
 *
 * Every statement here is something the code actually enforces, and each one
 * has a test behind it. The wording is deliberately specific ("one workspace
 * cannot read another's") rather than the vague "bank-grade security" that
 * marketing pages usually reach for and cannot substantiate.
 */
const POINTS = [
  {
    icon: Building2,
    title: "Your workspace is yours alone",
    body: "Every receipt, invoice, customer and document is scoped to the organization that created it, and that scope is enforced in the database access layer rather than in the interface. One workspace cannot read another's data by guessing an id.",
  },
  {
    icon: Users,
    title: "Permissions enforced on the server",
    body: "Roles decide what each person can do, and the API checks the role in the signed session on every request. Hiding a button is a convenience; the refusal happens behind it.",
  },
  {
    icon: ShieldCheck,
    title: "An audit trail of what happened",
    body: "Receipts issued or voided, invoices issued or cancelled, payments recorded, roles changed. Each event records who did it and when, and cannot be edited or deleted afterwards.",
  },
];

export function SecuritySection() {
  return (
    <section
      aria-labelledby="security-heading"
      className="border-b border-vg-border bg-vg-surface-1"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <h2
          id="security-heading"
          className="text-3xl font-semibold tracking-tight text-vg-white sm:text-4xl"
        >
          Your customers&apos; data stays separated
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-vg-text-muted">
          If you handle a customer&apos;s name, phone number and payment
          details, you need to know who else can see them. Here is exactly how
          that works.
        </p>

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-card border border-vg-border bg-vg-surface-2 p-6"
            >
              <Icon
                className="h-6 w-6 text-vg-accent-text"
                strokeWidth={1.9}
                aria-hidden
              />
              <h3 className="mt-4 text-lg font-semibold text-vg-white">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-vg-text-muted">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}