/**
 * Test bootstrap for DOM-environment tests.
 *
 * Registered as a Vitest `setupFiles` entry, but every assertion here is a
 * no-op unless the running file opted into jsdom — the pure-function tests
 * that make up most of this suite run in Node with no DOM and must not pay
 * for one, or break on a missing `document`.
 *
 * `@testing-library/jest-dom` is imported for its side effect of extending
 * `expect` with DOM matchers (`toHaveValue`, `toHaveAttribute`,
 * `toBeInTheDocument`) that Vitest does not provide on its own.
 */
import { afterEach } from "vitest";

const hasDom = typeof document !== "undefined";

if (hasDom) {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");

  // Unmount between tests. Without this a dialog left mounted holds
  // `document.body.style.overflow = "hidden"` into the next test, and the page
  // silently stops scrolling for the rest of the file.
  afterEach(() => {
    cleanup();
  });
}