import { describe, expect, it } from "vitest";
import { describeError } from "./Toast";
import { ApiError } from "@/lib/api";

/**
 * How a thrown value becomes copy a user can act on.
 *
 * This is the whole point of the change: fifteen call sites used a bare
 * `catch {}` and replaced the server's specific refusal with "Something went
 * wrong". The API already writes a good message for each case — refusing an
 * overpaid invoice, refusing to demote the last owner, refusing a duplicate
 * email — and those are the messages the user actually needs.
 *
 * These are pure functions precisely so they can be tested without a DOM,
 * matching the convention in this suite (`environment: "node"`).
 */

describe("describeError", () => {
  it("uses the message the API wrote", () => {
    const error = new ApiError(
      "That payment is more than the outstanding balance of NGN 40,000.00.",
      409,
      "OVERPAYMENT",
    );
    expect(describeError(error)).toBe(
      "That payment is more than the outstanding balance of NGN 40,000.00.",
    );
  });

  it("prefers a field-validation detail over the summary", () => {
    // The API answers a bad payload with a summary *and* a per-field map. The
    // field message names the thing the user has to change.
    const error = new ApiError("Please correct the highlighted fields.", 422, "VALIDATION_ERROR", {
      "items.0.unit_price": "Enter a price of 0 or more.",
    });
    expect(describeError(error)).toBe("Enter a price of 0 or more.");
  });

  it("falls back to the summary when there are no details", () => {
    const error = new ApiError("You cannot change the last owner's role.", 409);
    expect(describeError(error)).toBe("You cannot change the last owner's role.");
  });

  it("passes a plain Error's message through", () => {
    expect(describeError(new Error("Failed to fetch"))).toBe("Failed to fetch");
  });

  it("uses the caller's fallback when there is no message at all", () => {
    // The important case: `throw undefined`, a rejected promise with no
    // reason, or a thrown empty string must never render as "undefined" or
    // blank in front of a user.
    expect(describeError(undefined, "Couldn't send that invitation.")).toBe(
      "Couldn't send that invitation.",
    );
    expect(describeError(null, "Couldn't save your changes.")).toBe(
      "Couldn't save your changes.",
    );
    expect(describeError("", "Couldn't save your changes.")).toBe(
      "Couldn't save your changes.",
    );
  });

  it("still shows a thrown string, which is a real message", () => {
    // Not every throw is an Error. When a string does carry the reason, hiding
    // it behind a generic fallback would throw away the one useful detail.
    expect(describeError("something odd", "Couldn't save your changes.")).toBe(
      "something odd",
    );
  });

  it("never renders a blank message", () => {
    // An empty ApiError message would produce an empty toast — a failure the
    // user is told nothing about, which is the outcome this whole change
    // exists to prevent.
    expect(describeError(new ApiError("", 500), "Couldn't load your team.")).toBe(
      "Couldn't load your team.",
    );
    expect(describeError(new Error("   "), "Couldn't save.")).toBe("Couldn't save.");
  });

  it("truncates a runaway message rather than letting it cover the page", () => {
    const long = "A".repeat(400);
    const result = describeError(new ApiError(long, 400));
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith("…")).toBe(true);
  });

  it("does not truncate a message that fits", () => {
    const fits = "That invoice has already been issued and can no longer be edited.";
    expect(describeError(new ApiError(fits, 409))).toBe(fits);
  });

  it("preserves the last-owner refusal, which is the one users hit most", () => {
    // Regression guard on the exact wording the RBAC phase introduced. This
    // message is the only thing standing between a user and a locked-out
    // organization, so it must survive verbatim.
    const error = new ApiError(
      "An organization must keep at least one owner. Promote someone else first.",
      409,
      "LAST_OWNER",
    );
    expect(describeError(error)).toBe(
      "An organization must keep at least one owner. Promote someone else first.",
    );
  });
});