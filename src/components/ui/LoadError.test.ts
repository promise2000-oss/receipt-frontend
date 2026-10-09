import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoadError } from "./LoadError";

/**
 * Rendered rather than type-checked, because no browser is available in this
 * environment: `next build` only proves the JSX compiles, not that the failure
 * copy, its alert role, and a focusable retry control actually reach the
 * markup. The alert role is the part that matters — swapping a skeleton for
 * this text with nothing announced would leave a screen-reader user with no
 * idea anything went wrong.
 */
function render(message: string): string {
  return renderToStaticMarkup(
    createElement(LoadError, { message, onRetry: () => {} }),
  );
}

/** `renderToStaticMarkup` escapes quotes, and the copy under test has one. */
function decode(html: string): string {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (match, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&(amp|lt|gt|quot);/g, (match, name: string) =>
      ({ amp: "&", lt: "<", gt: ">", quot: '"' })[
        name as "amp" | "lt" | "gt" | "quot"
      ],
    );
}

describe("LoadError", () => {
  it("puts the failure copy in an alert", () => {
    const html = render("Can't reach the receipt service.");
    expect(html).toContain('role="alert"');
    expect(decode(html)).toContain("Can't reach the receipt service.");
  });

  it("renders a focusable button that offers a retry", () => {
    const html = render("Something failed.");
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
    expect(html).toContain("Try again");
  });

  it("does not invoke the retry handler while rendering", () => {
    // Called during render, it would fire on every keystroke of a re-render
    // and re-request in a loop.
    const onRetry = vi.fn();
    renderToStaticMarkup(createElement(LoadError, { message: "x", onRetry }));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("renders only what it was handed", () => {
    const html = render("Boom");
    expect(html).not.toContain("[object Object]");
    expect(html).not.toContain("at request");
  });
});
