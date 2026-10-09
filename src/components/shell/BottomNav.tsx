"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "./nav";
import { cn } from "@/lib/cn";

/** Mobile bottom nav — replaces the sidebar below lg. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-vg-border bg-vg-surface-1 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.06em] transition-colors",
                  item.cta
                    ? "text-vg-white"
                    : active
                      ? "text-vg-accent-text"
                      : "text-vg-text-muted hover:text-vg-white",
                )}
              >
                {item.cta ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-vg-red-900 text-vg-white">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                  </span>
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                )}
                <span>{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
