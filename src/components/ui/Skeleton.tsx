import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Soft gold shimmer block — never generic grey. */
export function Skeleton({
  className,
  rounded = "rounded-lg",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cn("skeleton gold-shimmer", rounded, className)}
      aria-hidden
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-card border border-brand-gold/20 bg-brand-black p-5 sm:p-6">
      <Skeleton className="h-3.5 w-24 bg-white/10" />
      <Skeleton className="mt-4 h-9 w-36 bg-white/10" />
      <Skeleton className="mt-3 h-3 w-20 bg-white/10" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-brand-gold/10">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="hidden h-3.5 w-20 sm:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-card border border-brand-gold/15 bg-surface p-4"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ReceiptPreviewSkeleton() {
  return (
    <div className="rounded-card border border-brand-gold/20 bg-surface">
      <Skeleton className="h-24 rounded-none rounded-t-card bg-brand-black/90" />
      <div className="space-y-4 p-6 sm:p-8">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-px w-full bg-brand-gold/20" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
        <Skeleton className="ml-auto h-10 w-48" />
      </div>
    </div>
  );
}

export function SkeletonBlock({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("skeleton gold-shimmer rounded-lg", className)}>
      {children}
    </div>
  );
}
