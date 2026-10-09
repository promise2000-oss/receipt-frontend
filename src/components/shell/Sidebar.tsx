"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "./nav";
import { useSession } from "@/components/auth/SessionProvider";
import { initials as monogramOf } from "@/lib/brand";
import { cn } from "@/lib/cn";

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.isActive(pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-11 items-center gap-3 rounded-control px-3.5 text-[15px] transition-colors",
        active
          ? "bg-brand-gold/15 font-medium text-brand-gold"
          : "text-cream/60 hover:bg-white/5 hover:text-cream",
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      {item.label}
      {active && (
        <span
          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-brand-gold"
          aria-hidden
        />
      )}
    </Link>
  );
}

/** Solid black sidebar — gold active states. Desktop only (lg+). */
export function Sidebar() {
  const pathname = usePathname();
  const { session, signOut } = useSession();

  const org = session?.business;
  const monogram = org ? monogramOf(org.name) : "";

  return (
    <aside className="no-print sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-r border-brand-gold/20 bg-brand-black lg:flex">
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="border-t border-brand-gold/15 p-4">
        <div className="flex items-center gap-3">
          {org?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo_url}
              alt=""
              aria-hidden
              className="h-9 w-9 shrink-0 rounded-full border border-brand-gold/40 bg-white object-contain p-0.5"
            />
          ) : (
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand-gold/50 text-xs font-semibold text-brand-gold"
              aria-hidden
            >
              {monogram || "–"}
            </span>
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm text-cream">
              {session?.org_name ?? "Signed out"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.16em] text-brand-gold">
              {session?.owner_name ?? ""}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-control border border-brand-gold/30 text-[13px] text-cream/70 transition-colors hover:border-brand-gold hover:text-brand-gold"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.9} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
