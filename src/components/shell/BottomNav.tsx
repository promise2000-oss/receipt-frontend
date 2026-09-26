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
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-brand-gold/20 bg-brand-black lg:hidden"
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
                    ? "text-brand-gold"
                    : active
                      ? "text-brand-gold"
                      : "text-cream/55 hover:text-cream",
                )}
              >
                {item.cta ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gold text-brand-black">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </span>
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
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
