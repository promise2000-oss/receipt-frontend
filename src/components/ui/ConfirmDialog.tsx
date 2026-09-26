"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Flat modal dialog — cream surface, thin gold border, no heavy shadow. */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center bg-brand-black/55 p-4 sm:items-center"
      onMouseDown={() => !busy && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-md rounded-card border border-brand-gold/30 bg-surface p-6 outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="dark" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
