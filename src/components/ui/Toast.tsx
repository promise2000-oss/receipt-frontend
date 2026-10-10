"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/api";

/**
 * Transient feedback: success confirmations and operation failures.
 *
 * Why this exists
 * ---------------
 * Two gaps made this necessary.
 *
 * 1. **Success was silent.** Issuing an invoice, sending an invitation,
 *    changing a role or removing a member all completed with no visible
 *    confirmation. A user who clicks "Send invite" and sees nothing cannot
 *    tell a slow request from a failed one, so they click again — and send
 *    two invitations.
 *
 * 2. **Error messages were discarded.** Fifteen call sites used a bare
 *    `catch {`, throwing away the message the API had already written. The
 *    server refuses an overpaid invoice with a specific reason; the UI was
 *    replacing that with "Something went wrong". The user is left retyping
 *    the same payment to hit the same wall.
 *
 * So {@link useToast} exposes one `notify` for both, and {@link describeError}
 * turns any thrown value into copy worth showing.
 *
 * Design constraints
 * ------------------
 * - **`aria-live` region.** A toast that only appears visually is silent for a
 *   screen reader, which makes it worse than nothing for a blind user.
 * - **Errors persist until dismissed.** A failure that vanishes in four
 *   seconds is a failure the user has to reproduce to read. Success is
 *   transient; an error is not.
 * - **One line, up to two.** Copy is constrained so a long API message cannot
 *   cover the page it is reporting on.
 * - **Rendered in a portal** to the document body, so a toast is never clipped
 *   by an ancestor's `overflow` or trapped behind a dialog's stacking context.
 */

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  /** Optional single retry/undo affordance. */
  action?: { label: string; onClick: () => void };
}

/** Success messages self-dismiss; errors wait to be read. */
const SUCCESS_MS = 4_000;
const INFO_MS = 5_000;
/** Longest single message shown; the rest is truncated rather than wrapping to 6 lines. */
const MAX_MESSAGE = 160;

interface ToastContextValue {
  notify: (tone: ToastTone, message: string, action?: Toast["action"]) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  /** Report a caught value. Success wording is supplied by the caller. */
  failure: (caught: unknown, fallback?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Copy for anything that was thrown.
 *
 * Order matters: an {@link ApiError} already carries a message the backend
 * wrote for this exact situation, so it wins. A field-validation error is a
 * map of field → message and its first entry is more useful than a summary,
 * so that is unwrapped too. Anything else genuinely is unknown, and says so.
 */
export function describeError(caught: unknown, fallback = "Something went wrong."): string {
  const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  if (caught instanceof ApiError) {
    // Field first: it names the thing to change. Then the summary, and only
    // then the fallback — a whitespace-only message would otherwise render as
    // a blank toast, which is a failure the user is told nothing about.
    const detail = caught.details ? clean(Object.values(caught.details)[0]) : "";
    return truncate(detail || clean(caught.message) || fallback);
  }

  const message = clean(caught instanceof Error ? caught.message : caught);
  return truncate(message || fallback);
}

function truncate(message: string): string {
  const clean = message.trim();
  if (clean.length <= MAX_MESSAGE) return clean;
  return `${clean.slice(0, MAX_MESSAGE - 1).trimEnd()}…`;
}

const TONE_STYLES: Record<ToastTone, { bar: string; icon: typeof Info; iconClass: string }> = {
  success: { bar: "bg-vg-success", icon: CheckCircle2, iconClass: "text-vg-success" },
  error: { bar: "bg-vg-error", icon: AlertTriangle, iconClass: "text-vg-error" },
  info: { bar: "bg-vg-accent", icon: Info, iconClass: "text-vg-accent-text" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  /** The portal target, supplied by {@link PortalHost} once it has mounted. */
  const [host, setHost] = useState<HTMLElement | null>(null);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback<ToastContextValue["notify"]>(
    (tone, message, action) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, tone, message, action }]);

      // Errors and anything with an action stay until dismissed: an
      // unrecoverable failure or a retry the user has not seen yet is not
      // something to make them race.
      if (tone !== "error" && !action) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), tone === "success" ? SUCCESS_MS : INFO_MS),
        );
      }
    },
    [dismiss],
  );

  // Clear pending timers on unmount so a dismissed provider cannot leave a
  // timeout firing into an unmounted tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (message) => notify("success", message),
      info: (message) => notify("info", message),
      failure: (caught, fallback) => notify("error", describeError(caught, fallback)),
      dismiss,
    }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <PortalHost onHost={setHost} />
      <ToastViewport toasts={toasts} onDismiss={dismiss} host={host} />
    </ToastContext.Provider>
  );
}

/**
 * The toast stack.
 *
 * Rendered through a portal anchored to `document.body`. A portal cannot be
 * created during the server render, and rendering nothing on the server then
 * the live region on the client is exactly what causes a hydration mismatch
 * here.
 *
 * The mount is tracked with a ref callback rather than `useState` +
 * `useEffect`. Both work, but the state version renders the tree twice on
 * every provider mount and trips React's cascading-render lint; the ref is
 * written during commit, which is the correct phase for "the DOM now exists".
 */
function ToastViewport({
  toasts,
  onDismiss,
  host,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
  host: HTMLElement | null;
}) {
  if (!host) return null;

  return createPortal(
    <div
      // `polite` so a confirmation waits for a pause rather than interrupting
      // a screen reader mid-sentence. Errors are announced through this same
      // region, which is why it is always in the DOM and never conditional.
      aria-live="polite"
      aria-atomic="false"
      className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
    >
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    // `document.body`, not the host element: anything portalled stays a child
    // of whatever it is rendered into, so a `hidden`, `display:none` or
    // `overflow:hidden` ancestor would silently swallow the whole stack. The
    // host is used purely as a mount detector.
    host.ownerDocument.body,
  );
}

/**
 * An empty element whose only job is to tell us the DOM exists.
 *
 * `document.body` is unavailable during SSR, so this proves "we are on the
 * client" before any portal is attempted. It is deliberately **not** `hidden`
 * and **not** `aria-hidden`:
 *
 *  - `hidden` (or `display:none`) would cascade to the portalled children and
 *    make every toast invisible while still being present in the DOM — which
 *    reads as "the toast fired but nothing showed".
 *  - `aria-hidden` would remove the live region from the accessibility tree,
 *    so the confirmation would never be announced.
 *
 * Passing the node back through a **ref callback** rather than reading
 * `document` in an effect is deliberate: a ref callback runs during commit —
 * the correct phase for "the DOM node now exists" — whereas setting state in
 * an effect body causes a cascading render.
 *
 * The element carries no `hidden`, no `display:none` and no `aria-hidden`: an
 * empty unstyled span has no box of its own, and the stack is portalled to
 * `document.body` rather than into it. Marking it hidden was tried first and
 * made every toast present-but-invisible.
 */
function PortalHost({ onHost }: { onHost: (node: HTMLElement | null) => void }) {
  return <span ref={onHost} />;
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const { bar, icon: Icon, iconClass } = TONE_STYLES[toast.tone];

  return (
    <div
      // `role="status"` on success and `role="alert"` on error: the assertive
      // role interrupts, which is right for a failure the user needs to stop
      // and read, and wrong for a receipt that was simply issued.
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 overflow-hidden",
        "rounded-card border border-vg-border bg-vg-surface-2 shadow-lg",
      )}
    >
      {/* Tone bar rather than a tinted background: the accent red surfaces in
          this app are close enough to the error red that a wash alone would
          be ambiguous. */}
      <span aria-hidden className={cn("w-1 self-stretch", bar)} />

      <Icon className={cn("mt-3.5 h-5 w-5 shrink-0", iconClass)} strokeWidth={2} aria-hidden />

      <p className="min-w-0 flex-1 py-3.5 text-sm leading-snug text-vg-white">
        {toast.message}
      </p>

      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="mr-2 mt-2.5 inline-flex h-9 shrink-0 items-center rounded-control px-3 text-[13px] font-medium text-vg-accent-text transition-colors hover:bg-vg-surface-3 hover:text-vg-white"
        >
          {toast.action.label}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="mr-2 mt-2.5 grid h-9 w-9 shrink-0 place-items-center rounded-control text-vg-text-muted transition-colors hover:bg-vg-surface-3 hover:text-vg-white"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/** The toast API. Throws outside a {@link ToastProvider} rather than no-oping. */
export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return value;
}