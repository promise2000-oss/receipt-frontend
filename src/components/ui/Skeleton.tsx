import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Accent shimmer block — the loader track is surface-3, never a grey. */
export function Skeleton({
  className,
  rounded = "rounded-control",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cn("skeleton accent-shimmer", rounded, className)}
      aria-hidden
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-card border border-vg-border bg-vg-surface-2 p-5 sm:p-6">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-4 h-9 w-36" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-vg-border">
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
          className="flex items-center gap-4 rounded-card border border-vg-border bg-vg-surface-2 p-4"
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
    <div className="rounded-card border border-vg-border bg-vg-surface-2">
      <Skeleton className="h-24 rounded-none rounded-t-card bg-vg-surface-3" />
      <div className="space-y-4 p-6 sm:p-8">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-px w-full" />
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

/**
 * The invoice detail loader.
 *
 * Mirrors `ReceiptPreviewSkeleton` but adds the three money cards and the
 * payments sidebar, because an invoice screen is a two-column layout and a
 * single centred skeleton would make the page visibly jump when the data
 * lands.
 */
export function InvoiceSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-card border border-vg-border bg-vg-surface-2 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-6 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="rounded-card border border-vg-border bg-vg-surface-2 p-5 sm:p-8">
          <div className="flex justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-56" />
            </div>
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="mt-5 h-px w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="mt-4 flex items-center gap-4">
              <Skeleton className="h-3.5 flex-1" />
              <Skeleton className="h-3.5 w-8" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
          <Skeleton className="ml-auto mt-6 h-10 w-48" />
        </div>

        <div className="rounded-card border border-vg-border bg-vg-surface-2 p-5">
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** List loader for the invoice history. */
export function HistorySkeleton() {
  return <TableSkeleton rows={5} />;
}

export function SkeletonBlock({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("skeleton accent-shimmer rounded-control", className)}>
      {children}
    </div>
  );
}
