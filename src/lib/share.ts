import { formatDate, formatMoney } from "./format";
import type { Business, Receipt } from "./types";

/**
 * Share links are minted by `GET /receipts/:id/share` and expire, so the URL
 * is passed in rather than derived. When it is missing (the link could not be
 * created) callers omit the QR and the "Verify:" line instead of printing a
 * link that would not open.
 */
export function receiptMessage(
  receipt: Receipt,
  business: Business,
  shareUrl?: string | null,
): string {
  const lines = [
    `*${business.name}* — Receipt ${receipt.receipt_number}`,
    formatDate(receipt.issue_date),
    `Total: ${formatMoney(receipt.total, business.currency)}`,
  ];
  if (shareUrl) lines.push(`Verify: ${shareUrl}`);
  return lines.join("\n");
}

/** wa.me deep link (TRD §1.1 delivery) */
export function whatsappUrl(
  receipt: Receipt,
  business: Business,
  shareUrl?: string | null,
): string {
  const digits = (receipt.customer_phone ?? "").replace(/\D/g, "");
  const international = digits.startsWith("234")
    ? digits
    : digits.startsWith("0")
      ? `234${digits.slice(1)}`
      : digits;
  const text = encodeURIComponent(receiptMessage(receipt, business, shareUrl));
  return international
    ? `https://wa.me/${international}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

export function emailUrl(
  receipt: Receipt,
  business: Business,
  shareUrl?: string | null,
): string {
  const subject = `Receipt ${receipt.receipt_number} from ${business.name}`;
  const body = receiptMessage(receipt, business, shareUrl).replace(/\*/g, "");
  const to = receipt.customer_email ?? "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
