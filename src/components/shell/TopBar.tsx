"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { useSession } from "@/components/auth/SessionProvider";

/** Solid black top bar — organization mark left, search, gold CTA always visible. */
export function TopBar() {
  const router = useRouter();
  const { session } = useSession();
  const [query, setQuery] = useState("");

  const orgName = session?.business.name;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/receipts?q=${encodeURIComponent(q)}` : "/receipts");
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-brand-gold/20 bg-brand-black">
      <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={session ? `${orgName} dashboard` : "Dashboard"}
          className="shrink-0"
        >
          <Logo variant="on-dark" showTagline={false} />
        </Link>

        <form
          onSubmit={onSubmit}
          role="search"
          className="relative ml-auto hidden w-full max-w-sm md:block"
        >
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search receipts or customers…"
            aria-label="Search receipts or customers"
            className="h-10 w-full rounded-full border border-brand-gold/30 bg-white/10 pl-10 pr-4 text-sm text-cream transition-colors placeholder:text-cream/45 focus:border-brand-gold focus:bg-white/15"
          />
        </form>

        <Link
          href="/receipts"
          aria-label="Search receipts"
          className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-brand-gold/30 text-brand-gold transition-colors hover:border-brand-gold hover:bg-brand-gold/10 md:hidden"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
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
