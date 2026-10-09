"use client";

import { cn } from "@/lib/cn";
import { initials } from "@/lib/brand";
import { useSession } from "@/components/auth/SessionProvider";

interface LogoProps {
  /** "on-dark" = black surfaces (top bar, sidebar) */
  variant?: "on-dark" | "on-light";
  /** Platform attribution line — the organization is primary, VisionaryGene quiet. */
  showTagline?: boolean;
  className?: string;
  /** Monogram only — used in tight spaces */
  compact?: boolean;
}

/**
 * The application's identity mark.
 *
 * When a session exists this renders **the signed-in organization** — its
 * uploaded logo when it has one, otherwise a monogram derived from its name.
 * Nothing about it is hardcoded: no organization name, no fixed initial. When
 * nobody is signed in (the loading splash, the sign-in page) it falls back to
 * the platform identity, because on those surfaces there is no organization
 * to show yet.
 */
export function Logo({
  variant = "on-dark",
  showTagline = true,
  className,
  compact = false,
}: LogoProps) {
  const { session } = useSession();
  const isDark = variant === "on-dark";

  const business = session?.business;
  const name = business?.name?.trim();
  const logo = business?.logo_url;

  /** Platform fallback — only reachable before a session resolves. */
  const displayName = name || "VisionaryGene";
  const monogram = name ? initials(name) : "V";

  const mark = logo ? (
    // Signed, per-organization URL — not a static asset next/image can size,
    // and it renders at 36px. Same call the receipt and settings make.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      aria-hidden
      className={cn(
        "h-9 w-9 shrink-0 rounded-[10px] border object-contain",
        isDark ? "border-white/20 bg-white p-0.5" : "border-black/10 bg-white p-0.5",
      )}
    />
  ) : (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border font-display leading-none",
        name ? "text-lg" : "text-xl",
        isDark
          ? "border-brand-gold/70 text-brand-gold"
          : "border-brand-black/30 text-brand-black",
      )}
      aria-hidden
    >
      {monogram}
    </span>
  );

  if (compact) return mark;

  return (
    <span className={cn("flex items-center gap-3", className)}>
      {mark}
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate font-display font-medium leading-none",
            "text-[15px] sm:text-[17px] tracking-[0.02em]",
            isDark ? "text-cream" : "text-brand-black",
          )}
        >
          {displayName}
        </span>
        {showTagline && (
          <span className="mt-1.5 truncate text-[9px] font-medium uppercase tracking-[0.34em] text-brand-gold">
            {name ? "Powered by VisionaryGene" : "Receipt Platform"}
          </span>
        )}
      </span>
    </span>
  );
}
