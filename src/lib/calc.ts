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
  tax: number;
  total: number;
}

export function lineTotal(item: LineItem): number {
  return round2((Number(item.quantity) || 0) * (Number(item.unit_price) || 0));
}

export function computeTotals(
  items: LineItem[],
  discount: number,
  taxRate: number,
): Totals {
  const subtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const safeDiscount = round2(Math.min(Math.max(Number(discount) || 0, 0), subtotal));
  const taxable = round2(subtotal - safeDiscount);
  const tax = round2(taxable * ((Number(taxRate) || 0) / 100));
  const total = round2(taxable + tax);
  return { subtotal, discount: safeDiscount, tax, total };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
