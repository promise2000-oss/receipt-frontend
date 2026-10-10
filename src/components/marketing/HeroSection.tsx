import { ButtonLink } from "@/components/ui/Button";

/**
 * The hero.
 *
 * Copy states what the product does and who it is for, then offers two clear
 * paths: start free, or sign in. No superlatives — "the best" or "number
 * one" would be an unverifiable claim, and the product spec rules them out.
 */
export function HeroSection() {
  return (
    <section className="border-b border-vg-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-vg-accent-text">
            Receipt &amp; invoicing platform
          </p>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-vg-white sm:text-5xl lg:text-6xl">
            Receipts and invoices that look like they came from a real
            company.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-vg-text-muted">
            Issue a branded receipt in under a minute, bill a customer on an
            invoice, record what they pay against it, and export every
            document as a watermarked PDF or a print-sharp image — from your
            phone or your desk.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Create your business account
            </ButtonLink>
            <ButtonLink href="/features" size="lg" variant="outline">
              Explore features
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="ghost">
              Sign in
            </ButtonLink>
          </div>

          <p className="mt-5 text-sm text-vg-text-muted">
            No card required. Your data stays in your own workspace.
          </p>
        </div>
      </div>
    </section>
  );
}