import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * A read that failed, shown in place of the skeleton it would otherwise leave
 * spinning forever.
 *
 * Without this, an unreachable API and a slow one look identical — the reader
 * has no way to tell "still loading" from "never going to load", and no way to
 * ask for another go.
 */
export function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {/* Glyph + text, so the failure is not carried by colour alone. */}
      <AlertTriangle className="mb-3 h-7 w-7 text-vg-error" strokeWidth={1.8} aria-hidden />
      <p role="alert" className="max-w-sm text-sm leading-relaxed text-vg-text-muted">
        {message}
      </p>
      <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
