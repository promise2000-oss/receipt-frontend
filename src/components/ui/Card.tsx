import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Panel on the raised surface — 1px border, 12px radius, no glow. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-card border border-vg-border bg-vg-surface-2",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-vg-border px-5 py-4 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-vg-white">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-vg-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  padded = true,
  className,
  children,
}: {
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(padded && "p-5 sm:p-6", className)}>{children}</div>
  );
}

/** Hairline divider in the brand border colour. */
export function Hairline({ className }: { className?: string }) {
  return (
    <div className={cn("h-px w-full bg-vg-border", className)} aria-hidden />
  );
}
