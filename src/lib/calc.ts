/**
 * Single source of truth for receipt arithmetic — used by the
 * builder, the preview document, and the dashboard.
 */

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  /** net × tax_rate%. Present because invoices declare tax; receipts issue at 0. */
  tax: number;
  total: number;
}

export function lineTotal(item: LineItem): number {
  return round2((Number(item.quantity) || 0) * (Number(item.unit_price) || 0));
}

/**
 * Single source of truth for document arithmetic.
 *
 *   subtotal  = Σ line totals
 *   net       = subtotal − discount
 *   tax       = net × taxRate%      (discount is applied before tax)
 *   total     = net + tax
 *
 * The API computes the identical function in `@eleos/shared` and recomputes
 * it on every write; this copy drives the live preview so the figure on
 * screen matches the document. It is a *preview*, never the source of truth.
 */
export function computeTotals(
  items: LineItem[],
  discount: number,
  taxRate = 0,
): Totals {
  const subtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const safeDiscount = round2(Math.min(Math.max(Number(discount) || 0, 0), subtotal));
  const net = round2(subtotal - safeDiscount);
  const tax = round2((net * Math.max(Number(taxRate) || 0, 0)) / 100);
  return { subtotal, discount: safeDiscount, tax, total: round2(net + tax) };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
