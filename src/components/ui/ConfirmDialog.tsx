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
  /** Destructive confirm — switches the button to the outlined error style. */
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Modal dialog — surface-2, hairline border, 70% black scrim. */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  busy = false,
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * The Escape handler needs the *current* `onClose` and `busy`, but this
   * effect must not depend on them.
   *
   * Every call site passes `onClose` as an inline arrow (`onClose={() => …}`),
   * so its identity changes on every parent render — which is every keystroke.
   * With `onClose` in the dependency array the effect re-ran on each one and
   * called `dialogRef.current.focus()`, pulling focus off the input and onto
   * the dialog container: the user typed one character, the field blurred, and
   * the text they had already entered stayed put because the state was never
   * the problem. `busy` had the same effect, stealing focus again when a
   * submit started and finished.
   *
   * These refs are refreshed after every render (see the effect below) so the
   * keydown listener always closes over fresh values without ever re-running.
   */
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  // Declared *before* the `open` effect so the refs are already current when it
  // runs — effects execute in declaration order.
  useEffect(() => {
    onCloseRef.current = onClose;
    busyRef.current = busy;
  });

  useEffect(() => {
    if (!open) return;

    // Only claim focus if nothing inside already holds it. A dialog containing
    // an `autoFocus` field has already placed the caret where the user needs
    // it, and yanking it back is the same bug from the other direction.
    if (!dialogRef.current?.contains(document.activeElement)) {
      dialogRef.current?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: "var(--vg-overlay)" }}
      onMouseDown={() => !busy && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        // `max-h` + `overflow-y-auto`: below `sm` this is a bottom sheet, so a
        // tall dialog (the void and cancel forms carry a textarea) would grow
        // upward past the top of a short screen with the confirm button out of
        // reach. Scrolling the panel keeps both the reason and the buttons
        // reachable, and `overscroll-contain` stops the page behind moving.
        //
        // `pb-[max(1.5rem,env(safe-area-inset-bottom))]` keeps the action row
        // clear of the iOS home indicator, which a plain `p-6` sits under.
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-card border border-vg-border bg-vg-surface-2 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-semibold tracking-tight text-vg-white">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-vg-text-muted">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
