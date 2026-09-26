import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  /* Primary action: solid gold + black text */
  primary:
    "bg-brand-gold text-brand-black hover:bg-brand-gold-soft active:bg-brand-gold",
  /* Secondary action: solid black + gold text */
  dark: "bg-brand-black text-brand-gold hover:bg-[#1d1d1d]",
  outline:
    "border border-brand-gold/40 bg-surface text-ink hover:border-brand-gold hover:bg-brand-gold/10",
  ghost: "text-muted hover:bg-brand-gold/10 hover:text-ink",
  /* Destructive — muted grey, never red (palette stays black/gold/cream) */
  danger:
    "border border-muted/40 bg-transparent text-muted hover:border-muted/60 hover:bg-muted/10 hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  icon: "h-11 w-11",
};

const BASE =
  "inline-flex select-none items-center justify-center rounded-control font-medium tracking-[0.02em] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50";

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
