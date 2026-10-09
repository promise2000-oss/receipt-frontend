import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  /* Primary action: brand red fill + white text (6.57:1). */
  primary:
    "bg-vg-red-900 text-vg-white hover:bg-vg-red-900-hover active:bg-vg-red-900-active",
  /* Secondary: transparent with a brand red keyline. */
  outline:
    "border border-vg-red-900 bg-transparent text-vg-white hover:bg-vg-red-900/12",
  /* Tertiary: no border, accent text. */
  ghost:
    "bg-transparent text-vg-accent-text hover:bg-vg-surface-3 hover:text-vg-white",
  /* Destructive — deliberately *not* a red fill. A solid red button would
     be indistinguishable from "Issue receipt" at a glance, so void/delete
     is an outline in the brighter error red (5.77:1) and is always behind
     a ConfirmDialog. */
  danger:
    "border border-vg-error bg-transparent text-vg-error hover:bg-vg-error/12",
};

/* Every size clears 44px so touch targets stay reachable; the steps
   between them carry the hierarchy instead. */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-11 px-3.5 text-[13px] gap-1.5",
  md: "h-12 px-5 text-sm gap-2",
  lg: "h-13 px-6 text-[15px] gap-2",
  icon: "h-11 w-11",
};

const BASE =
  "inline-flex select-none items-center justify-center rounded-button font-medium tracking-[0.01em] transition-colors duration-150 disabled:pointer-events-none disabled:bg-vg-disabled-bg disabled:text-vg-disabled-text";

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
