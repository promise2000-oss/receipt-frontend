"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Ellipsis,
  Send,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, formatMoney, formatQuantity } from "@/lib/format";
import {
  can,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type Invoice,
  type PaymentMethod,
} from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { ShareBar } from "@/components/receipt/ShareBar";
import { invoiceAsShareable } from "@/lib/share";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { InvoiceSkeleton } from "@/components/ui/Skeleton";
import { describeError, useToast } from "@/components/ui/Toast";

/**
 * One invoice: the document, its lifecycle actions, and its payment history.
 *
 * The flow the whole screen is built around is **partial payment**. Record
 * ₦200,000 against a ₦570,000 invoice and the receipt generated is for
 * ₦200,000, the balance drops to ₦370,000, and the status becomes
 * "Partially Paid" — all of it decided and returned by the API in one
 * transaction, none of it predicted here.
 */

const METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string; icon: typeof Banknote }> = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "other", label: "Other", icon: Ellipsis },
];

/**
 * The `ShareBar` is written for receipts and takes one. Rather than widening
 * that component's types for a second document shape, an invoice is projected
 * onto the subset a share message actually reads: who issued it, what the
 * reference is, when, how much, and whether it is settled.
 */
export function InvoicePreview({ id }: { id: string }) {
  const router = useRouter();
  const session = useSession().session;
  const business = session?.business;
  const currency = business?.currency ?? "NGN";

  /** undefined = loading · null = not found */
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [reference, setReference] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [amountTouched, setAmountTouched] = useState(false);

  const toast = useToast();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  /** Its own slot: cancellation writes here, not into the payment error. */
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [issueBusy, setIssueBusy] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await api.getInvoice(id);
        if (!cancelled) setInvoice(found);
      } catch (caught) {
        if (cancelled) return;
        setLoadError(
          caught instanceof Error ? caught.message : "Couldn't load this invoice.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadError) {
    return (
      <EmptyState
        title="Couldn't load this invoice"
        description={loadError}
        action={
          <ButtonLink href="/invoices" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </ButtonLink>
        }
      />
    );
  }

  if (invoice === undefined || !business) return <InvoiceSkeleton />;

  if (invoice === null) {
    return (
      <EmptyState
        title="Invoice not found"
        description={`We couldn't find an invoice with the reference “${id}”. It may belong to another account.`}
        action={
          <ButtonLink href="/invoices" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </ButtonLink>
        }
      />
    );
  }

  const isDraft = invoice.status === "draft";
  const isCancelled = invoice.status === "cancelled";
  const isSettled = invoice.balance_due <= 0;

  /**
   * Lifecycle actions are gated by role as well as by invoice state, from the
   * same matrix the API enforces. A viewer can open this page and read every
   * figure; they simply are not offered buttons the server would refuse.
   */
  const role = session?.role ?? "viewer";
  const canPay = can(role, "invoice.recordPayment") && !isDraft && !isCancelled && !isSettled;
  const canIssue = can(role, "invoice.issue") && isDraft;
  const canCancel = can(role, "invoice.cancel") && !isDraft && !isCancelled;

  const parsedAmount = Number(amount) || 0;
  const overBalance = parsedAmount > invoice.balance_due;
  const canSubmitPayment = parsedAmount > 0 && !overBalance && !payBusy;

  async function openPayment() {
    // Default to the full balance — the common case — but leave the field
    // editable so a part-payment is one keystroke away.
    setAmount(invoice!.balance_due.toFixed(2));
    setAmountTouched(false);
    setPayError(null);
    setPayOpen(true);
  }

  async function submitPayment() {
    setAmountTouched(true);
    if (!canSubmitPayment) return;
    setPayBusy(true);
    setPayError(null);
    try {
      const result = await api.recordPayment(invoice!.invoice_number, {
        amount: parsedAmount,
        method,
        reference,
      });
      setInvoice(result.invoice);
      setPayOpen(false);
      setReference("");
      setAmount("");
      router.refresh();
      // Naming the receipt makes it findable, and the balance is the number
      // the user actually wants to know after paying.
      toast.success(
        result.receipt?.receipt_number
          ? `${formatMoney(parsedAmount)} received — receipt ${result.receipt.receipt_number}. ${
              result.invoice.balance_due > 0
                ? `${formatMoney(result.invoice.balance_due)} still outstanding.`
                : "Paid in full."
            }`
          : `${formatMoney(parsedAmount)} received.`,
      );
    } catch (caught) {
      // The server refuses an overpayment with the exact figure that is
      // outstanding; that number is the answer, so it is not replaced.
      setPayError(describeError(caught, "Couldn't record that payment."));
    } finally {
      setPayBusy(false);
    }
  }

  async function issue() {
    setIssueBusy(true);
    setIssueError(null);
    try {
      const issued = await api.issueInvoice(invoice!.invoice_number);
      setInvoice(issued);
      router.refresh();
      toast.success(`Invoice ${issued.invoice_number} issued. It can no longer be edited.`);
    } catch (caught) {
      setIssueError(describeError(caught, "Couldn't issue this invoice."));
    } finally {
      setIssueBusy(false);
    }
  }

  async function cancel() {
    if (cancelReason.trim().length < 3) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      const cancelled = await api.cancelInvoice(
        invoice!.invoice_number,
        cancelReason.trim(),
      );
      setInvoice(cancelled);
      setCancelOpen(false);
      setCancelReason("");
      router.refresh();
      // Cancellation is destructive and irreversible, so it is confirmed out
      // loud rather than left to be inferred from the badge changing.
      toast.success(`Invoice ${cancelled.invoice_number} cancelled. It stays in your records.`);
    } catch (caught) {
      // Its own error slot: writing this to the payment error left the reason
      // invisible, because the payment dialog was closed.
      setCancelError(describeError(caught, "Couldn't cancel this invoice."));
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <>
      {/* ---- Header ---- */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-sm text-vg-text-muted transition-colors hover:text-vg-accent-text"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          All invoices
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {canIssue && (
            <Button variant="primary" size="sm" onClick={issue} disabled={issueBusy}>
              <Send className="h-4 w-4" strokeWidth={1.9} />
              {issueBusy ? "Issuing…" : "Issue Invoice"}
            </Button>
          )}
          {canPay && (
            <Button variant="primary" size="sm" onClick={openPayment}>
              <Banknote className="h-4 w-4" strokeWidth={1.9} />
              Record Payment
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4" strokeWidth={1.9} />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="no-print mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-vg-white">
            Invoice {invoice.invoice_number}
          </h1>
          <StatusBadge
            tone={invoice.status}
            label={INVOICE_STATUS_LABELS[invoice.status]}
          />
        </div>
        <p className="mt-1.5 text-sm text-vg-text-muted">
          Issued {formatDateTime(invoice.issue_date)} · {invoice.customer_name}
          {invoice.due_date ? ` · due ${formatDate(invoice.due_date)}` : ""}
        </p>
        {issueError && (
          <p role="alert" className="mt-3 text-sm text-vg-error">
            {issueError}
          </p>
        )}
      </div>

      {/* ---- Draft notice: an issued invoice is frozen ---- */}
      {isDraft && (
        <div className="no-print mb-5 flex items-start gap-3 rounded-card border border-vg-border bg-vg-surface-2 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-vg-warning" strokeWidth={2} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-vg-white">
              This invoice is still a draft
            </p>
            <p className="mt-1 text-sm leading-relaxed text-vg-text-muted">
              Issue it to lock the figures and start recording payments. Once issued
              it can no longer be edited — corrections are made by cancelling and
              issuing a new invoice.
            </p>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="no-print mb-5 flex items-start gap-3 rounded-card border border-vg-red-900 bg-vg-red-900/12 px-5 py-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-vg-white" strokeWidth={2} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-vg-white">This invoice was cancelled</p>
            {invoice.cancel_reason && (
              <p className="mt-1 text-sm leading-relaxed text-vg-text-muted">
                “{invoice.cancel_reason}”
              </p>
            )}
          </div>
        </div>
      )}

      {invoice.status === "overdue" && (
        <div className="no-print mb-5 flex items-start gap-3 rounded-card border border-vg-error bg-vg-error/12 px-5 py-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-vg-error" strokeWidth={2} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-vg-white">This invoice is overdue</p>
            <p className="mt-1 text-sm leading-relaxed text-vg-text-muted">
              {formatMoney(invoice.balance_due, currency)} was due on{" "}
              {invoice.due_date ? formatDate(invoice.due_date) : "the due date"}.
            </p>
          </div>
        </div>
      )}

      {/* ---- Money summary ---- */}
      <div className="no-print mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Invoice total", value: invoice.total, tone: "text-vg-white" },
          { label: "Amount paid", value: invoice.amount_paid, tone: "text-vg-success" },
          {
            label: "Balance due",
            value: invoice.balance_due,
            tone: invoice.balance_due > 0 ? "text-vg-warning" : "text-vg-success",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vg-text-muted">
                {stat.label}
              </div>
              <div className={`mt-1.5 text-lg font-semibold tabular-nums ${stat.tone}`}>
                {formatMoney(stat.value, currency)}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* ---- The document ---- */}
        <div className="mx-auto w-full max-w-3xl">
          <article className="rounded-card border border-vg-border bg-vg-surface-2 p-5 sm:p-8">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-vg-border pb-5">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-vg-white">
                  {business.name}
                </div>
                <div className="mt-1 text-sm text-vg-text-muted">
                  {[business.address, business.phone, business.email]
                    .filter(Boolean)
                    .join(" · ") || "No contact details"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-vg-text-muted">
                  Invoice
                </div>
                <div className="mt-1 text-lg tracking-[0.08em] text-vg-white">
                  {invoice.invoice_number}
                </div>
              </div>
            </header>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-vg-text-muted">
                  Billed To
                </div>
                <div className="mt-2 text-[15px] font-medium text-vg-white">
                  {invoice.customer_name}
                </div>
                {invoice.customer_phone && (
                  <div className="mt-1 text-sm text-vg-text-muted">
                    {invoice.customer_phone}
                  </div>
                )}
                {invoice.customer_email && (
                  <div className="text-sm text-vg-text-muted">
                    {invoice.customer_email}
                  </div>
                )}
              </div>
              <div className="sm:text-right">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-vg-text-muted">
                  Details
                </div>
                <div className="mt-2 text-sm text-vg-text-muted">
                  Issued {formatDate(invoice.issue_date)}
                </div>
                {invoice.due_date && (
                  <div className="text-sm text-vg-text-muted">
                    Due {formatDate(invoice.due_date)}
                  </div>
                )}
                {invoice.po_reference && (
                  <div className="text-sm text-vg-text-muted">
                    PO {invoice.po_reference}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[10px] border border-vg-border">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-vg-surface-1">
                  <tr>
                    {["Description", "Qty", "Unit Price", "Total"].map((heading, index) => (
                      <th
                        key={heading}
                        className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-vg-text-muted ${
                          index === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-vg-border">
                      <td className="px-4 py-3 text-vg-white">{item.description}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-vg-text-muted">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-vg-text-muted">
                        {formatMoney(item.unit_price, currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-vg-white">
                        {formatMoney(item.line_total, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-vg-text-muted">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums text-vg-white">
                    {formatMoney(invoice.subtotal, currency)}
                  </dd>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-vg-text-muted">
                    <dt>Discount</dt>
                    <dd className="tabular-nums text-vg-white">
                      − {formatMoney(invoice.discount, currency)}
                    </dd>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-vg-text-muted">
                    <dt>Tax ({invoice.tax_rate}%)</dt>
                    <dd className="tabular-nums text-vg-white">
                      {formatMoney(invoice.tax, currency)}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-vg-border pt-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-vg-white">
                    Total
                  </dt>
                  <dd className="text-2xl font-semibold tabular-nums text-vg-white">
                    {formatMoney(invoice.total, currency)}
                  </dd>
                </div>
              </dl>
            </div>

            {invoice.terms && (
              <div className="mt-5 rounded-[10px] border border-vg-border bg-vg-surface-1 px-4 py-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-vg-text-muted">
                  Terms
                </div>
                <p className="mt-1 text-sm text-vg-text-muted">{invoice.terms}</p>
              </div>
            )}

            {invoice.notes && (
              <div className="mt-3 rounded-[10px] border border-vg-border bg-vg-surface-1 px-4 py-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-vg-text-muted">
                  Notes
                </div>
                <p className="mt-1 text-sm text-vg-text-muted">{invoice.notes}</p>
              </div>
            )}

            <p className="mt-6 border-t border-vg-border pt-4 text-center text-[10px] uppercase tracking-[0.22em] text-vg-text-muted">
              {formatDate(invoice.issue_date)} · Powered by VisionaryGene
            </p>
          </article>

          {!isDraft && (
            <div className="mt-5">
              <ShareBar
                document={invoiceAsShareable(invoice)}
                business={business}
                kind="invoice"
              />
            </div>
          )}
        </div>

        {/* ---- Payment history ---- */}
        <aside className="no-print space-y-4">
          <Card>
            <CardHeader
              title="Payments"
              description={
                invoice.payments.length === 0
                  ? "Nothing received yet."
                  : `${invoice.payments.length} payment${invoice.payments.length === 1 ? "" : "s"} recorded.`
              }
            />
            <CardBody>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-vg-text-muted">
                  {isDraft
                    ? "Issue this invoice first, then payments can be recorded against it."
                    : "No payments recorded against this invoice yet."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="rounded-control border border-vg-border bg-vg-surface-1 px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-vg-white">
                            {formatMoney(payment.amount, currency)}
                          </div>
                          <div className="mt-0.5 text-xs text-vg-text-muted">
                            {formatDate(payment.paid_at)} ·{" "}
                            {PAYMENT_METHOD_LABELS[payment.method]}
                          </div>
                          {payment.reference && (
                            <div className="mt-0.5 text-xs text-vg-text-muted">
                              Ref {payment.reference}
                            </div>
                          )}
                        </div>
                        {payment.receipt_id && (
                          <Link
                            href="/receipts"
                            className="shrink-0 text-xs text-vg-accent-text hover:underline"
                          >
                            Receipt issued
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {canPay && (
                <Button variant="primary" className="mt-4 w-full" onClick={openPayment}>
                  <Banknote className="h-4 w-4" strokeWidth={1.9} />
                  Record Payment
                </Button>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>

      {/* ---- Record payment ---- */}
      <ConfirmDialog
        open={payOpen}
        title="Record a payment"
        description="A receipt is generated automatically for the amount received — including for part-payments."
        confirmLabel="Record payment"
        busy={payBusy}
        onConfirm={submitPayment}
        onClose={() => {
          if (!payBusy) {
            setPayOpen(false);
            setPayError(null);
          }
        }}
      >
        <div className="space-y-4">
          <Field
            label={`Amount (balance due ${formatMoney(invoice.balance_due, currency)})`}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-vg-text-muted">
                {currency === "NGN" ? "₦" : currency}
              </span>
              <TextInput
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setAmountTouched(true);
                }}
                onBlur={() => setAmountTouched(true)}
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className="pl-8"
                aria-describedby="payment-balance"
              />
            </div>
          </Field>

          <p id="payment-balance" className="text-xs text-vg-text-muted">
            {formatMoney(invoice.amount_paid, currency)} of{" "}
            {formatMoney(invoice.total, currency)} received ·{" "}
            {formatMoney(invoice.balance_due, currency)} outstanding.
          </p>

          {amountTouched && overBalance && (
            <p role="alert" className="flex items-start gap-1.5 text-xs text-vg-error">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                That&apos;s more than the {formatMoney(invoice.balance_due, currency)}{" "}
                still outstanding.
              </span>
            </p>
          )}

          <div>
            <p className="mb-2.5 text-[13px] font-medium text-vg-white">Payment method</p>
            <SegmentedControl
              options={METHOD_OPTIONS}
              value={method}
              onChange={setMethod}
              ariaLabel="Payment method"
            />
          </div>

          <Field label="Reference (optional)" hint="Transfer reference, cheque number…">
            <TextInput
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="TRF-88213"
            />
          </Field>

          {payError && (
            <p role="alert" className="flex items-start gap-1.5 text-xs text-vg-error">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{payError}</span>
            </p>
          )}
        </div>
      </ConfirmDialog>

      {/* ---- Cancel ---- */}
      <ConfirmDialog
        open={cancelOpen}
        danger
        title="Cancel this invoice?"
        description="Cancelling can't be undone and the invoice stays in your history. The figures are preserved so your records still reconcile."
        confirmLabel="Cancel invoice"
        busy={cancelBusy}
        onConfirm={cancel}
        onClose={() => {
          if (!cancelBusy) {
            setCancelOpen(false);
            setCancelReason("");
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-vg-white">
            Reason (required)
          </span>
          <TextArea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="e.g. Customer cancelled the order"
            className="min-h-20"
          />
        </label>
        {cancelError && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-vg-error">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{cancelError}</span>
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

/** Kept for the share helper's signature parity with receipts. */
export type { Invoice };