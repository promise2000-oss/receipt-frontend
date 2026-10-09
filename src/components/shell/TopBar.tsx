"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { useSession } from "@/components/auth/SessionProvider";

/**
 * Near-black top bar: the platform wordmark on the left, then a quiet
 * organization chip for workspace context, then search and the primary CTA.
 *
 * The wordmark leads because the brand spec places it top-left of the navbar;
 * the organization's own mark still reaches the user through that chip and
 * through the sidebar, receipt and browser title.
 */
export function TopBar() {
  const router = useRouter();
  const { session } = useSession();
  const [query, setQuery] = useState("");

  const orgName = session?.business.name;
  const orgLogo = session?.business.logo_url;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/receipts?q=${encodeURIComponent(q)}` : "/receipts");
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-vg-border bg-vg-surface-1">
      <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="VisionaryGene dashboard" className="shrink-0">
          <Logo showTagline={false} />
        </Link>

        {/* Workspace context — the organization this session belongs to. */}
        {session && (
          <>
            <span
              className="hidden h-6 w-px bg-vg-border lg:block"
              aria-hidden
            />
            <Link
              href="/settings"
              className="hidden min-w-0 items-center gap-2.5 rounded-control px-2 py-1.5 transition-colors hover:bg-vg-surface-2 lg:flex"
            >
              {orgLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={orgLogo}
                  alt=""
                  aria-hidden
                  className="h-7 w-7 shrink-0 rounded-[6px] border border-vg-border bg-vg-white object-contain p-0.5"
                />
              ) : (
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-vg-red-900 text-[10px] font-bold text-vg-white"
                  aria-hidden
                >
                  {orgName?.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium leading-tight text-vg-white">
                  {orgName}
                </span>
                <span className="block text-[10px] uppercase leading-tight tracking-[0.14em] text-vg-text-muted">
                  Workspace
                </span>
              </span>
            </Link>
          </>
        )}

        <form
          onSubmit={onSubmit}
          role="search"
          className="relative ml-auto hidden w-full max-w-sm md:block"
        >
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vg-text-muted"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search receipts or customers…"
            aria-label="Search receipts or customers"
            className="h-11 w-full rounded-control border border-vg-border bg-vg-surface-2 pl-10 pr-4 text-sm text-vg-white transition-colors placeholder:text-vg-placeholder hover:border-vg-surface-3 focus:control-focus focus:outline-none"
          />
        </form>

        <Link
          href="/receipts"
          aria-label="Search receipts"
          className="ml-auto grid h-11 w-11 place-items-center rounded-control border border-vg-border text-vg-white transition-colors hover:bg-vg-surface-2 md:hidden"
        >
          <Search className="h-5 w-5" strokeWidth={2} />
        </Link>

        <ButtonLink href="/receipts/new" variant="primary" aria-label="New Receipt">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="sm:hidden">New</span>
          <span className="hidden sm:inline">New Receipt</span>
        </ButtonLink>
      </div>
    </header>
  );
}
