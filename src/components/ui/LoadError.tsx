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
      <p role="alert" className="max-w-sm text-sm leading-relaxed text-muted">
        {message}
      </p>
      <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
