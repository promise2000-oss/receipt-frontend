import { formatDate, formatMoney } from "./format";
import type { Business, Receipt } from "./types";

/** Signed public link scheme (TRD §5) — mock base for the prototype. */
export const SHARE_BASE = "https://receipt.eleosstyles.com/r";

export function receiptShareUrl(receipt: Receipt): string {
  return `${SHARE_BASE}/${receipt.receipt_number}`;
}

export function receiptMessage(receipt: Receipt, business: Business): string {
  return [
    `*${business.name}* — Receipt ${receipt.receipt_number}`,
    formatDate(receipt.issue_date),
    `Total: ${formatMoney(receipt.total, business.currency)}`,
    `Verify: ${receiptShareUrl(receipt)}`,
  ].join("\n");
}

/** wa.me deep link (TRD §1.1 delivery) */
export function whatsappUrl(receipt: Receipt, business: Business): string {
  const digits = (receipt.customer_phone ?? "").replace(/\D/g, "");
  const international = digits.startsWith("234")
    ? digits
    : digits.startsWith("0")
      ? `234${digits.slice(1)}`
      : digits;
  const text = encodeURIComponent(receiptMessage(receipt, business));
  return international
    ? `https://wa.me/${international}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

export function emailUrl(receipt: Receipt, business: Business): string {
  const subject = `Receipt ${receipt.receipt_number} from ${business.name}`;
  const body = receiptMessage(receipt, business).replace(/\*/g, "");
  const to = receipt.customer_email ?? "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
