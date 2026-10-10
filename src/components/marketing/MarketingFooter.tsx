import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/**
 * The public site footer.
 *
 * Navigation is rendered here as well as in the header, deliberately: these
 * are the internal links a crawler discovers on a single page, which is how a
 * new site gets crawled without a sitemap being read first.
 */
export function MarketingFooter({
  nav,
}: {
  nav: Array<{ href: string; label: string }>;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-vg-border bg-vg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <Logo className="h-7 w-auto" />
            <p className="mt-4 text-sm leading-relaxed text-vg-text-muted">
              Branded receipts and invoices for businesses that need their
              paperwork to look right.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-vg-text-muted">
              Future Intelligence Vision.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-vg-white">
              Product
            </h2>
            <ul className="mt-4 space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-vg-text-muted transition-colors hover:text-vg-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-vg-white">
              Company
            </h2>
            <ul className="mt-4 space-y-1">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy", label: "Privacy policy" },
                { href: "/terms", label: "Terms of service" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-vg-text-muted transition-colors hover:text-vg-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-vg-border pt-6">
          <p className="text-xs text-vg-text-muted">
            © {year} VisionaryGene. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}