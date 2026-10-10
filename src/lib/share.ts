import { formatDate, formatMoney } from "./format";
import type { Business, PaymentStatus, Receipt } from "./types";

/**
 * The subset of a document a *message* actually reads.
 *
 * Receipts and invoices are different shapes — an invoice has a balance, not
 * an amount paid — but a WhatsApp or email message about either needs the same
 * five things: who issued it, what the reference is, when, how much, and
 * whether it is settled. Modelling that subset explicitly is what lets one
 * share component serve both without either pretending to be the other.
 */
export interface ShareableDocument {
  /** The UUID the export and share endpoints address the document by. */
  id: string;
  receipt_number: string;
  issue_date: string;
  total: number;
  payment_status: PaymentStatus;
  customer_phone: string | null;
  customer_email: string | null;
}

/**
 * Project an invoice onto {@link ShareableDocument}.
 *
 * A settled invoice reads as `paid`; anything else reads as `partial` — the
 * recipient is being told money is still owed, which is the single most
 * important thing a message about an invoice can convey.
 */
export function invoiceAsShareable(
  invoice: Pick<
    import("./types").Invoice,
    | "id"
    | "invoice_number"
    | "issue_date"
    | "total"
    | "balance_due"
    | "customer_phone"
    | "customer_email"
  >,
): ShareableDocument {
  return {
    id: invoice.id,
    receipt_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    total: invoice.total,
    payment_status: invoice.balance_due <= 0 ? "paid" : "partial",
    customer_phone: invoice.customer_phone,
    customer_email: invoice.customer_email,
  };
}

/**
 * Share links are minted by `GET /receipts/:id/share` and expire, so the URL
 * is passed in rather than derived. When it is missing (the link could not be
 * created) callers omit the QR and the "Verify:" line instead of printing a
 * link that would not open.
 */
export function receiptMessage(
  receipt: ShareableDocument,
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
  receipt: ShareableDocument,
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
  receipt: ShareableDocument,
  business: Business,
  shareUrl?: string | null,
): string {
  const subject = `Receipt ${receipt.receipt_number} from ${business.name}`;
  const body = receiptMessage(receipt, business, shareUrl).replace(/\*/g, "");
  const to = receipt.customer_email ?? "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** A receipt satisfies the shareable shape by construction. */
export function receiptAsShareable(receipt: Receipt): ShareableDocument {
  return {
    id: receipt.id,
    receipt_number: receipt.receipt_number,
    issue_date: receipt.issue_date,
    total: receipt.total,
    payment_status: receipt.payment_status,
    customer_phone: receipt.customer_phone,
    customer_email: receipt.customer_email,
  };
}
