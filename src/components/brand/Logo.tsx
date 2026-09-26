import { cn } from "@/lib/cn";

interface LogoProps {
  /** "on-dark" = black surfaces (top bar, receipt header band) */
  variant?: "on-dark" | "on-light";
  showTagline?: boolean;
  className?: string;
  /** Monogram only — used in tight spaces */
  compact?: boolean;
}

/**
 * Eleosstyles wordmark — Playfair Display serif is reserved for the
 * brand name only, per the brand style guide.
 */
export function Logo({
  variant = "on-dark",
  showTagline = true,
  className,
  compact = false,
}: LogoProps) {
  const isDark = variant === "on-dark";

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-brand-gold/70 font-display text-xl leading-none",
          isDark ? "text-brand-gold" : "text-brand-black",
        )}
        aria-hidden
      >
        E
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display font-medium uppercase leading-none tracking-[0.18em] sm:text-[17px] sm:tracking-[0.24em]",
              "text-[15px]",
              isDark ? "text-cream" : "text-brand-black",
            )}
          >
            Eleosstyles
          </span>
          {showTagline && (
            <span className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.34em] text-brand-gold">
              Receipt System
            </span>
          )}
        </span>
      )}
    </span>
  );
}
