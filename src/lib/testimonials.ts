/**
 * Customer feedback shown on the public site.
 *
 * ## This array is empty on purpose.
 *
 * A testimonial is a person putting their name to words they said. Writing
 * one here — even a plausible one, even marked "example" in a comment —
 * produces a page that *looks* like it has customers. The moment someone
 * screenshots it, or a search engine indexes it, or a sales conversation
 * quotes it, a fabricated quote is indistinguishable from a real one. That is
 * why this ships empty and the UI renders an honest panel instead of cards.
 *
 * ## How to add real feedback
 *
 * Append entries with the person's actual words and their actual name, and
 * only after they have agreed to be named:
 *
 * ```ts
 * {
 *   id: "ada-obi-2026-03",       // stable, never reused
 *   quote: "…their words, verbatim…",
 *   name: "Ada Obi",
 *   business: "Ada Obi Tailoring",
 *   role: "Owner",               // optional
 *   avatar_url: "…",             // optional, only with permission
 *   verified: false,             // see below
 * }
 * ```
 *
 * ### On `verified`
 *
 * There is no verification process in this codebase, so nothing may set this
 * to `true`. The component refuses to render a verification mark unless it is
 * true, and nothing sets it true, so no badge is ever produced. If a
 * verification flow is ever built, that is the moment the flag earns its name.
 *
 * ### What must never go here
 *
 * Invented names, invented quotations, star ratings with no review behind
 * them, customer counts, usage statistics, or an award this product has not
 * won. None of those are "placeholder content" — each one is a claim.
 */

/** One piece of customer feedback, as supplied by the business. */
export interface Testimonial {
  /** Stable identifier. Used as the React key, so it must not change. */
  id: string;
  /**
   * The person's own words, verbatim and unedited. Not a summary, not a
   * paraphrase written for marketing — a paraphrase presented as a quote is
   * still a fabricated quote.
   */
  quote: string;
  /** Their name, as they agreed to be shown. */
  name: string;
  /** Their business, if they were happy for it to appear. */
  business?: string;
  /** Their role or trade. */
  role?: string;
  /**
   * Avatar, only where the person has given permission. Absent means the
   * monogram is used — never a stock face presented as theirs.
   */
  avatar_url?: string;
  /** See the note above. No verification flow exists, so this stays false. */
  verified?: boolean;
}

/**
 * Real, attributable customer feedback.
 *
 * Empty until the business supplies some. See the file header for the rules
 * on what may be added.
 */
export const TESTIMONIALS: readonly Testimonial[] = [];

/**
 * The capabilities described alongside the feedback.
 *
 * These are statements about the software, each traceable to something the
 * product actually does today, and each one linked to the page that explains
 * it. They are deliberately kept separate from `TESTIMONIALS`: a feature the
 * product has is not the same claim as a person endorsing it, and merging the
 * two is how a marketing page starts implying endorsement it cannot show.
 */
export const CUSTOMER_STORIES: ReadonlyArray<{
  title: string;
  body: string;
  href: string;
}> = [
  {
    title: "Documents that look like they came from a real company",
    body: "Your logo and brand colours are applied to the receipt header, the totals block, the printable page and every exported file — so a customer receives something that looks like it belongs to you, not to a tool.",
    href: "/features/receipts",
  },
  {
    title: "Getting paid over time, without chasing",
    body: "Bill on an invoice, record each payment as it arrives, and watch the balance fall. A receipt is generated for every payment, so your customer gets a document for the money that actually arrived.",
    href: "/features/invoicing",
  },
  {
    title: "One workspace that keeps its own data to itself",
    body: "Receipts, invoices, customers and files are scoped to the organization that created them, and roles decide what each person can do — enforced on the server, not just hidden in the interface.",
    href: "/features",
  },
  {
    title: "From a phone on the shop floor, or a desk at the office",
    body: "The same document renders correctly on a 320px phone and a 1440px desktop. Export a watermarked PDF or a print-sharp image, and share it through your device's own share sheet.",
    href: "/features/receipts",
  },
];