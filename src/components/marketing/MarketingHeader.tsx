import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The public site header.
 *
 * A server component with no client JavaScript: the navigation is plain
 * links, so a crawler gets the whole structure in the initial HTML and a
 * browser without JS still gets a working site. Nothing here fetches, which
 * also means no request blocks the first paint.
 */
export function MarketingHeader({
  nav,
  activePath,
}: {
  nav: Array<{ href: string; label: string }>;
  activePath: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-vg-border bg-vg-black/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="VisionaryGene home"
        >
          <Logo className="h-7 w-auto" />
        </Link>

        <nav aria-label="Main" className="hidden min-w-0 flex-1 md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = activePath === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-vg-white"
                        : "inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-vg-text-muted transition-colors hover:text-vg-white"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Get started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}