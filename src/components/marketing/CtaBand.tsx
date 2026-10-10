import { ButtonLink } from "@/components/ui/Button";

/**
 * The closing call to action.
 *
 * Every button here points at a route that exists. A call to action that
 * 404s is worse than no call to action, and a link to a non-existent pricing
 * page is exactly that kind of promise.
 */
export function CtaBand() {
  return (
    <section className="border-b border-vg-border bg-vg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="rounded-card border border-vg-border bg-vg-surface-2 p-8 text-center sm:p-12">
          <h2 className="text-3xl font-semibold tracking-tight text-vg-white sm:text-4xl">
            Issue your first receipt in about a minute
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-vg-text-muted">
            Create a workspace, add your logo, and send a properly branded
            document to a customer.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Create your business account
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="outline">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}