/**
 * @vitest-environment jsdom
 *
 * Regression: a text field lost focus after one or two keystrokes.
 *
 * The symptom was that `ConfirmDialog`'s focus effect listed `onClose` in its
 * dependencies. Every call site passes `onClose` as an inline arrow, so its
 * identity changed on every parent render — that is, on every keystroke. The
 * effect therefore re-ran per character and called `dialogRef.current.focus()`,
 * moving focus from the input onto the dialog container. The typed text stayed
 * because state was never involved.
 *
 * These tests fail against the old implementation and pass against the fix.
 * The assertion that matters is `document.activeElement`: a test that only
 * checked the value would have passed while the bug was live.
 */
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * A minimal stand-in for the real forms: a controlled text field inside the
 * dialog, plus whatever else a caller would render. Kept deliberately small so
 * a failure can only mean the dialog moved focus, not that some unrelated part
 * of the app is misbehaving.
 */
function DialogWithField({
  onClose,
  busy = false,
  label = "Email address",
}: {
  onClose: () => void;
  busy?: boolean;
  label?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <ConfirmDialog
      open
      title="Invite a team member"
      description="They receive a one-time link."
      confirmLabel="Send invitation"
      busy={busy}
      onConfirm={() => {}}
      onClose={onClose}
    >
      <label>
        {label}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label={label}
        />
      </label>
    </ConfirmDialog>
  );
}

describe("ConfirmDialog does not steal focus while typing", () => {
  it("keeps focus in the field through a full typed string", async () => {
    const user = userEvent.setup();
    // `onClose` is a fresh arrow on every render — exactly how all seven call
    // sites pass it, and the thing that made the old effect re-run.
    const { rerender } = render(<DialogWithField onClose={() => {}} />);

    const input = screen.getByLabelText("Email address");
    await user.click(input);
    await user.type(input, "promise@example.com");

    expect(input).toHaveValue("promise@example.com");
    expect(document.activeElement).toBe(input);

    // Force another render through the parent, the way typing does.
    rerender(<DialogWithField onClose={() => {}} />);
    expect(document.activeElement).toBe(input);
  });

  it("survives typing when busy flips, which used to refocus as well", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DialogWithField onClose={() => {}} busy={false} />);

    const input = screen.getByLabelText("Email address");
    await user.click(input);
    await user.type(input, "a@b.co");

    rerender(<DialogWithField onClose={() => {}} busy />);
    expect(document.activeElement).toBe(input);
    rerender(<DialogWithField onClose={() => {}} busy={false} />);
    expect(document.activeElement).toBe(input);
  });

  it("leaves an already-focused field alone when the dialog opens", async () => {
    // `autoFocus` is used by the customer dialog. The old effect took focus
    // back unconditionally on open, defeating it before the user typed.
    function AutoFocused() {
      const [value] = useState("");
      return (
        <ConfirmDialog
          open
          title="New customer"
          confirmLabel="Save"
          onConfirm={() => {}}
          onClose={() => {}}
        >
          <input autoFocus aria-label="Customer name" value={value} readOnly />
        </ConfirmDialog>
      );
    }
    render(<AutoFocused />);
    expect(document.activeElement).toBe(screen.getByLabelText("Customer name"));
  });

  it("still moves focus into the dialog when nothing inside holds it", async () => {
    // The reason the effect exists at all: a dialog that opens without moving
    // focus leaves the caret behind in the page and screen readers do not
    // announce the dialog.
    render(
      <ConfirmDialog
        open
        title="Confirm"
        confirmLabel="Yes"
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );
    expect(document.activeElement).toHaveAttribute("role", "dialog");
  });

  it("still closes on Escape, and ignores it while busy", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(<DialogWithField onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    // A fresh handler, as the inline arrows produce — the listener must read
    // the current one rather than the one captured when it was registered.
    const next = vi.fn();
    rerender(<DialogWithField onClose={next} />);
    await user.keyboard("{Escape}");
    expect(next).toHaveBeenCalledTimes(1);

    rerender(<DialogWithField onClose={next} busy />);
    await user.keyboard("{Escape}");
    expect(next).toHaveBeenCalledTimes(1); // busy — unchanged
  });
});