"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "./nav";
import { useSession } from "@/components/auth/SessionProvider";
import { initials as monogramOf } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * One nav item. The active row carries both signals the brand spec asks for —
 * a brand-red fill *and* a 3px left indicator — so the current page is still
 * obvious in greyscale and to anyone who cannot separate the red from the
 * muted grey beside it. `aria-current="page"` carries it to assistive tech.
 */
function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.isActive(pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-11 items-center gap-3 rounded-control pl-4 pr-3.5 text-[15px] transition-colors",
        active
          ? "bg-vg-red-900 font-semibold text-vg-white"
          : "text-vg-text-muted hover:bg-vg-surface-2 hover:text-vg-white",
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-vg-orange-red"
          aria-hidden
        />
      )}
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
      {item.label}
    </Link>
  );
}

/** Near-black sidebar — brand red active states. Desktop only (lg+). */
export function Sidebar() {
  const pathname = usePathname();
  const { session, signOut } = useSession();

  const org = session?.business;
  const monogram = org ? monogramOf(org.name) : "";

  return (
    <aside className="no-print sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-r border-vg-border bg-vg-surface-1 lg:flex">
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="border-t border-vg-border p-4">
        <div className="flex items-center gap-3">
          {org?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo_url}
              alt=""
              aria-hidden
              className="h-9 w-9 shrink-0 rounded-full border border-vg-border bg-vg-white object-contain p-0.5"
            />
          ) : (
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-vg-red-900 bg-vg-red-900 text-xs font-bold text-vg-white"
              aria-hidden
            >
              {monogram || "–"}
            </span>
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium text-vg-white">
              {session?.org_name ?? "Signed out"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.16em] text-vg-text-muted">
              {session?.owner_name ?? ""}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-control border border-vg-border text-[13px] text-vg-text-muted transition-colors hover:border-vg-surface-3 hover:bg-vg-surface-2 hover:text-vg-white"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
