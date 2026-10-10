"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/brand";
import { useOptionalSession } from "@/components/auth/SessionProvider";

/**
 * The VisionaryGene mark, extracted from the source artwork to
 * `public/brand/mark.png`. Red ink on a transparent plate — the neuron lines
 * are holes, not white, so the same file reads correctly on the near-black
 * chrome and on any light surface without a second variant.
 */
const PLATFORM_MARK = "/brand/mark.png";

/**
 * The wordmark: VISIONARY in white, GENE in the brand accent.
 *
 * `#D4430F` on its own only reaches 4.04:1 on a card — under the 4.5:1 body
 * bar — so "GENE" takes the accent-text token (`#DA5F33`, 4.97:1 there)
 * while `#D4430F` stays reserved for fills, rules and the mark artwork.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-[15px] font-bold uppercase leading-none tracking-[0.16em] sm:text-[17px]",
        className,
      )}
    >
      <span className="text-vg-white">Visionary</span>
      <span className="text-vg-accent-text">Gene</span>
    </span>
  );
}

interface LogoProps {
  /** Platform attribution line — the organization is primary, VisionaryGene quiet. */
  showTagline?: boolean;
  className?: string;
  /** Mark only — used in tight spaces */
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
 *
 * The former `variant` prop went away with the light chrome: every surface
 * this renders on is now the same dark family, so there was no longer a
 * second treatment to select between.
 */
export function Logo({
  showTagline = true,
  className,
  compact = false,
}: LogoProps) {
  // `useSession` throws when there is no provider, which is the case on the
  // public marketing pages — they render outside the `(app)` group and must
  // not depend on an authenticated session to draw the platform's own name.
  // Reading the context directly and falling back is the same behaviour as
  // being signed out, which is exactly right for those surfaces.
  const sessionState = useOptionalSession();
  const session = sessionState?.session;

  const business = session?.business;
  const name = business?.name?.trim();
  const logo = business?.logo_url;

  const mark = logo ? (
    // Signed, per-organization URL — not a static asset next/image can size,
    // and it renders at 36px. Same call the receipt and settings make.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      aria-hidden
      className="h-9 w-9 shrink-0 rounded-control border border-vg-border bg-vg-white object-contain p-0.5"
    />
  ) : name ? (
    // Monogram on a brand-red fill — white text clears 6.57:1 on it.
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-vg-red-900 bg-vg-red-900 text-lg font-semibold leading-none text-vg-white"
      aria-hidden
    >
      {initials(name)}
    </span>
  ) : (
    <Image
      src={PLATFORM_MARK}
      alt=""
      aria-hidden
      width={36}
      height={37}
      className="h-9 w-9 shrink-0"
      preload
    />
  );

  if (compact) return mark;

  return (
    <span className={cn("flex items-center gap-3", className)}>
      {mark}
      <span className="flex min-w-0 flex-col leading-none">
        {name ? (
          <span className="truncate text-[15px] font-semibold leading-none tracking-[0.01em] text-vg-white sm:text-[17px]">
            {name}
          </span>
        ) : (
          <Wordmark />
        )}
        {showTagline && (
          <span className="mt-1.5 truncate text-[9px] font-medium uppercase tracking-[0.34em] text-vg-accent-text">
            {name ? "Powered by VisionaryGene" : "Receipt Platform"}
          </span>
        )}
      </span>
    </span>
  );
}
