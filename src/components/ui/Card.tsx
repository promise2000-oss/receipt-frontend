import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Flat surface card — thin gold hairlines, never heavy shadows. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-card border border-brand-gold/20 bg-surface", className)}>
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
        "flex flex-wrap items-center justify-between gap-3 border-b border-brand-gold/15 px-5 py-4 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
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

/** Thin gold rule used instead of heavy borders. */
export function GoldRule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-brand-gold/25", className)} aria-hidden />;
}
