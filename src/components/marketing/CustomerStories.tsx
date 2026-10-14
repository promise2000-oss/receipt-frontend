import Link from "next/link";
import { Quote, ArrowRight } from "lucide-react";
import {
  CUSTOMER_STORIES,
  TESTIMONIALS,
  type Testimonial,
} from "@/lib/testimonials";
import { initials as monogramOf } from "@/lib/brand";

/**
 * Customer feedback and what the product is for.
 *
 * The section is built around a distinction that is easy to lose and
 * expensive to get wrong: **a capability is not an endorsement.** What the
 * software does can be stated plainly and linked to the page that proves it.
 * What a *person* thought about it can only be shown if that person said it.
 *
 * So the two are rendered as separate blocks. `CUSTOMER_STORIES` describes the
 * software and is always populated. `TESTIMONIALS` holds real, attributable
 * quotes and is empty until the business supplies some — and when it is empty
 * this renders an honest panel saying exactly that, rather than inventing a
 * quote to fill the space.
 *
 * An empty panel is the correct output here. A plausible-looking card with an
 * invented name is indistinguishable from a real testimonial once it is
 * screenshotted, indexed, or repeated by someone in a sales conversation, and
 * by then the disclaimer is long gone.
 */

/** A real testimonial card. Only ever reached when TESTIMONIALS has entries. */
function TestimonialCard({ entry }: { entry: Testimonial }) {
  return (
    <li className="h-full">
      <figure className="flex h-full flex-col rounded-card border border-vg-border bg-vg-surface-2 p-6 transition-colors hover:border-vg-surface-3 hover:bg-vg-row-hover">
        <Quote
          className="h-5 w-5 shrink-0 text-vg-accent-text"
          strokeWidth={2}
          aria-hidden
        />

        {/* `hyphens: auto` plus a break-all fallback: a long word in a quote
            (a URL, a product name) must not widen the card at 320px. */}
        <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-vg-white [overflow-wrap:anywhere]">
          {entry.quote}
        </blockquote>

        <figcaption className="mt-5 flex items-center gap-3 border-t border-vg-border pt-4">
          {entry.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.avatar_url}
              alt=""
              aria-hidden
              className="h-10 w-10 shrink-0 rounded-full border border-vg-border object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-vg-border bg-vg-surface-1 text-xs font-semibold text-vg-white"
            >
              {monogramOf(entry.name)}
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-vg-white">
              {entry.name}
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-vg-text-muted">
              {[entry.role, entry.business].filter(Boolean).join(" · ")}
            </span>
          </span>

          {/*
            No verification flow exists, so nothing sets `verified` and this
            never renders. It is here so that adding real entries does not
            tempt anyone to fake a badge — the condition is explicit rather
            than an omission someone would "fill in" later.
          */}
          {entry.verified && (
            <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-vg-success">
              Verified
            </span>
          )}
        </figcaption>
      </figure>
    </li>
  );
}

/**
 * What this says when there is no customer feedback to show.
 *
 * Not an apology and not a placeholder card — a plain statement of what the
 * section is for, so the page reads as deliberately quiet rather than broken
 * or unfinished.
 */
function NoFeedbackYet() {
  return (
    <div className="rounded-card border border-dashed border-vg-border bg-vg-surface-1 p-6 sm:p-8">
      <h3 className="text-base font-semibold text-vg-white">
        No customer feedback published yet
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-vg-text-muted">
        We publish what customers actually say about VisionaryGene, in their
        own words, and we will not write it for them. There is no feedback to
        show yet, so this section stays empty rather than carrying a quote
        nobody said.
      </p>
    </div>
  );
}

export function CustomerStories() {
  return (
    <section
      aria-labelledby="stories-heading"
      className="border-b border-vg-border bg-vg-surface-1"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-vg-accent-text">
            Customer feedback
          </p>
          <h2
            id="stories-heading"
            className="mt-5 text-3xl font-semibold tracking-tight text-vg-white sm:text-4xl"
          >
            What the product is for, and what customers say
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-vg-text-muted">
            The first four describe VisionaryGene itself and link to the page
            that backs each one. The last is reserved for what a customer has
            told us — shown only when they have said it.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {CUSTOMER_STORIES.map((story) => (
            <li key={story.title}>
              <Link
                href={story.href}
                className="flex h-full flex-col rounded-card border border-vg-border bg-vg-surface-2 p-6 transition-colors hover:border-vg-surface-3 hover:bg-vg-row-hover"
              >
                <h3 className="text-lg font-semibold text-vg-white">
                  {story.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-vg-text-muted">
                  {story.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-vg-accent-text">
                  Read more
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          {TESTIMONIALS.length === 0 ? (
            <NoFeedbackYet />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((entry) => (
                <TestimonialCard key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}