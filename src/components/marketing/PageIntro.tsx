import type { ReactNode } from "react";

/**
 * The standard opening for an inner marketing page.
 *
 * One `<h1>` per page, in a real `<header>`, with an `<h2>` per section
 * beneath it. Keeping the hierarchy correct is what lets assistive technology
 * and a crawler both tell what the page is actually about — a page whose
 * heading is a styled `<div>` reads as having no title at all.
 */
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-vg-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-vg-accent-text">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-vg-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-vg-text-muted">
            {description}
          </p>
          {children}
        </header>
      </div>
    </section>
  );
}