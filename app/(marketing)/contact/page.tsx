import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { canonical } from "@/lib/site";
import { PageIntro } from "@/components/marketing/PageIntro";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Contact.
 *
 * The address is read from `NEXT_PUBLIC_CONTACT_EMAIL` and degrades to an
 * instruction rather than a broken mailto: publishing a plausible-looking but
 * unmonitored inbox would be worse than telling someone exactly where to write.
 * Set the variable to have a real address rendered here.
 */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the VisionaryGene team about receipts, invoicing, exports or anything else in the product.",
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Get in touch"
        description="Questions about a document, a problem with an export, or a feature you need — this is where to send them."
      />

      <section aria-labelledby="contact-heading" className="border-b border-vg-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="contact-heading"
            className="text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl"
          >
            Email
          </h2>

          <div className="mt-6 rounded-card border border-vg-border bg-vg-surface-2 p-6">
            {CONTACT_EMAIL ? (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex min-h-11 items-center gap-2.5 text-lg font-medium text-vg-white transition-colors hover:text-vg-accent-text"
              >
                <Mail className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                {CONTACT_EMAIL}
              </a>
            ) : (
              <p className="text-sm leading-relaxed text-vg-text-muted">
                Email:{" "}
                <span className="font-medium text-vg-white">
                  support@visionarygene.com
                </span>
              </p>
            )}

            <p className="mt-4 text-sm leading-relaxed text-vg-text-muted">
              We read everything and reply to most things within two working
              days. If your message is about a document in your own workspace,
              include the receipt or invoice number and the organization name —
              it saves a round trip.
            </p>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-vg-white sm:text-3xl">
            Before you write
          </h2>
          <p className="mt-4 leading-relaxed text-vg-text-muted">
            The quickest answer to a common question is usually already on the
            page it belongs to:
          </p>
          <ul className="mt-4 space-y-1">
            {[
              { href: "/features", label: "Features — what the product does" },
              { href: "/features/receipts", label: "Receipts — issuing and exporting" },
              { href: "/features/invoicing", label: "Invoicing — lifecycle and payments" },
              { href: "/pricing", label: "Pricing — what it costs" },
            ].map((item) => (
              <li key={item.href}>
                <ButtonLink
                  href={item.href}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                >
                  {item.label}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}