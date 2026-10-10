import { describe, expect, it } from "vitest";
import { computeTotals, lineTotal, round2 } from "./calc";

/**
 * Document arithmetic.
 *
 * The server is the authority — `@eleos/shared#computeTotals` recomputes
 * every figure on write — but this module drives the live preview, so a
 * disagreement here would show the user a total the document then refuses to
 * agree with. These tests pin the shared rules.
 */

describe("lineTotal", () => {
  it("multiplies quantity by unit price, rounded to two places", () => {
    expect(lineTotal({ description: "x", quantity: 3, unit_price: 2500 })).toBe(7500);
    // 3 × 33.333 = 99.999, which must round to a clean 100 rather than
    // leaking the float representation (99.99900000000001) into the document.
    expect(lineTotal({ description: "x", quantity: 3, unit_price: 33.333 })).toBe(100);
  });

  it("treats missing or invalid input as zero rather than NaN", () => {
    expect(lineTotal({ description: "x", quantity: 0, unit_price: 100 })).toBe(0);
    expect(lineTotal({ description: "x", quantity: 2, unit_price: Number.NaN })).toBe(0);
  });
});

describe("computeTotals", () => {
  it("sums the lines", () => {
    const totals = computeTotals(
      [
        { description: "a", quantity: 2, unit_price: 50_000 },
        { description: "b", quantity: 1, unit_price: 20_000 },
      ],
      0,
    );
    expect(totals.subtotal).toBe(120_000);
    expect(totals.discount).toBe(0);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(120_000);
  });

  it("applies the discount before the tax", () => {
    // 100,000 − 10,000 = 90,000 net; 7.5% of that is 6,750.
    const totals = computeTotals(
      [{ description: "a", quantity: 1, unit_price: 100_000 }],
      10_000,
      7.5,
    );
    expect(totals.subtotal).toBe(100_000);
    expect(totals.discount).toBe(10_000);
    expect(totals.tax).toBe(6750);
    expect(totals.total).toBe(96_750);
  });

  it("never lets a discount exceed the subtotal", () => {
    const totals = computeTotals(
      [{ description: "a", quantity: 1, unit_price: 100 }],
      500,
    );
    expect(totals.discount).toBe(100);
    expect(totals.total).toBe(0);
  });

  it("ignores a negative discount or tax rate", () => {
    const totals = computeTotals(
      [{ description: "a", quantity: 1, unit_price: 1000 }],
      -500,
      -10,
    );
    expect(totals.discount).toBe(0);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(1000);
  });

  it("keeps receipt arithmetic unchanged at a zero tax rate", () => {
    // Receipts dropped tax from the form; the omitted argument must behave
    // exactly as it did before invoices existed.
    const totals = computeTotals([{ description: "a", quantity: 2, unit_price: 2500 }], 0);
    expect(totals).toEqual({ subtotal: 5000, discount: 0, tax: 0, total: 5000 });
  });

  it("handles an empty invoice", () => {
    expect(computeTotals([], 0, 0)).toEqual({
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
    });
  });
});

describe("round2", () => {
  it("rounds half-up to two decimal places", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(99.999)).toBe(100);
  });

  it("does not drift across a long sum of decimals", () => {
    // The classic float trap: 0.1 added ten times is 0.9999999999999999.
    const sum = Array.from({ length: 10 }, () => 0.1).reduce((a, b) => a + b, 0);
    expect(round2(sum)).toBe(1);
  });
});