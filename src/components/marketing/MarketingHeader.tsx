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
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        {/*
          `min-w-0` with no `shrink-0` is the structural guarantee that this
          row cannot overflow. The logo was previously `shrink-0` and rigid, so
          on a 320px screen the wordmark, the tagline and two buttons together
          exceeded the viewport and every marketing page scrolled sideways —
          102px of it. Letting this child shrink means the *wordmark* absorbs the
          pressure (it already truncates) instead of the page scrolling.
        */}
        <Link
          href="/"
          className="flex min-h-11 min-w-0 items-center gap-2.5"
          aria-label="VisionaryGene home"
        >
          <Logo className="h-7 w-auto sm:h-8" />
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
          {/*
            "Sign in" is the secondary path and is reachable from the footer on
            every one of these pages, so dropping it below `sm` buys the
            primary action room instead of pushing the row past the viewport.
          */}
          <ButtonLink
            href="/login"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
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