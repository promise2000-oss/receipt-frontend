import type { ReactNode } from "react";
import { canonical } from "@/lib/site";
import { PageIntro } from "@/components/marketing/PageIntro";

/**
 * Shared shell for the two legal pages.
 *
 * Privacy and Terms are the same kind of document — long, plain, and read
 * rarely — so the layout lives here rather than being copied twice. The prose
 * itself is written per page, because the two say very different things.
 */
export function LegalPage({
  path,
  title,
  description,
  intro,
  children,
}: {
  path: string;
  title: string;
  description: string;
  intro: string;
  children: ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical(path),
    isPartOf: { "@id": "https://visionarygene.com/#website" },
  };

  return (
    <>
      <PageIntro eyebrow="Legal" title={title} description={intro} />
      <section className="border-b border-vg-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <div className="space-y-10">{children}</div>
        </div>
      </section>
    </>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={heading.replace(/\W+/g, "-").toLowerCase()}>
      <h2
        id={heading.replace(/\W+/g, "-").toLowerCase()}
        className="text-xl font-semibold tracking-tight text-vg-white"
      >
        {heading}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-vg-text-muted">
        {children}
      </div>
    </section>
  );
}