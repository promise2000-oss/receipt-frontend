import { ButtonLink } from "@/components/ui/Button";

/**
 * How it works.
 *
 * Kept to three steps because a longer list on a landing page reads as filler.
 * Each step is a real screen in the product, with a link into the app so the
 * claim is checkable rather than asserted.
 */
const STEPS = [
  {
    title: "Create your workspace",
    body: "Sign up with your business name. You become its owner, and every receipt, invoice and customer you create from then on belongs to that workspace.",
  },
  {
    title: "Add your branding",
    body: "Upload a logo and set your colours. They flow into the receipt header, the totals block, the printable page and every exported document.",
  },
  {
    title: "Bill, get paid, export",
    body: "Issue a receipt or an invoice, record payments as they arrive, and send the customer a branded PDF or image.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-b border-vg-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <h2
          id="how-heading"
          className="text-3xl font-semibold tracking-tight text-vg-white sm:text-4xl"
        >
          Up and running in three steps
        </h2>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <div
                aria-hidden
                className="grid h-11 w-11 place-items-center rounded-full border border-vg-red-900 bg-vg-red-900/15 text-base font-semibold text-vg-white"
              >
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-vg-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-vg-text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <ButtonLink href="/signup" size="lg">
            Get started
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}