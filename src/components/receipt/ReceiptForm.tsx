"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Ellipsis,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { computeTotals, lineTotal } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import type {
  Customer,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

interface ItemRow {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

const METHOD_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}> = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "other", label: "Other", icon: Ellipsis },
];

const STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
];

const newRow = (key: string): ItemRow => ({
  key,
  description: "",
  quantity: "1",
  unitPrice: "",
});

interface ReceiptFormProps {
  duplicateOf?: string | null;
  prefillCustomerId?: string | null;
}

export function ReceiptForm({ duplicateOf, prefillCustomerId }: ReceiptFormProps) {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  /** The organization's currency — already on the session, no second call. */
  const currency = useSession().session?.business.currency ?? "NGN";

  const [selected, setSelected] = useState<{
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [rows, setRows] = useState<ItemRow[]>([newRow("row-0")]);
  const [discount, setDiscount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [notes, setNotes] = useState("");

  const [prefilling, setPrefilling] = useState(Boolean(duplicateOf));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Load customers (+ optional prefill) ---- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const customerList = await api.getCustomers();
      if (cancelled) return;
      setCustomers(customerList);

      if (prefillCustomerId) {
        const match = customerList.find((item) => item.id === prefillCustomerId);
        if (match) {
          setSelected({
            id: match.id,
            name: match.name,
            phone: match.phone ?? undefined,
            email: match.email ?? undefined,
          });
        }
      }

      if (duplicateOf) {
        const receipt = await api.getReceipt(duplicateOf);
        if (cancelled) return;
        if (receipt) {
          setRows(
            receipt.items.map((item, index) => ({
              key: `row-${index}`,
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: String(item.unit_price),
            })),
          );
          setDiscount(receipt.discount > 0 ? String(receipt.discount) : "");
          setMethod(receipt.payment_method);
          setStatus(receipt.payment_status);
          setNotes(receipt.notes ?? "");
          setSelected({
            id: receipt.customer_id ?? undefined,
            name: receipt.customer_name,
            phone: receipt.customer_phone ?? undefined,
            email: receipt.customer_email ?? undefined,
          });
        }
        setPrefilling(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [duplicateOf, prefillCustomerId]);

  /* ---- Derived ---- */
  const customerName = selected ? selected.name : query.trim();

  const parsedItems = rows
    .filter((row) => row.description.trim() !== "")
    .map((row) => ({
      description: row.description.trim(),
      quantity: Number(row.quantity) || 0,
      unit_price: Number(row.unitPrice) || 0,
    }));

  const totals = computeTotals(parsedItems, Number(discount) || 0);

  const itemsValid =
    parsedItems.length > 0 &&
    parsedItems.every((item) => item.quantity >= 1 && item.unit_price >= 0);

  const canSubmit =
    !submitting && !prefilling && customerName !== "" && itemsValid;

  const matches = query.trim()
    ? customers
        .filter((customer) => {
          const needle = query.trim().toLowerCase();
          return (
            customer.name.toLowerCase().includes(needle) ||
            (customer.phone ?? "").toLowerCase().includes(needle)
          );
        })
        .slice(0, 6)
    : [];

  /* ---- Mutations ---- */
  function updateRow(key: string, patch: Partial<ItemRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(key: string) {
    setRows((current) => {
      const next = current.filter((row) => row.key !== key);
      return next.length > 0 ? next : [newRow("row-0")];
    });
  }

  function addRow() {
    setRows((current) => [...current, newRow(`row-${Date.now()}`)]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const receipt = await api.createReceipt({
        customer: {
          id: selected?.id,
          name: customerName,
          phone: selected?.phone ?? newPhone,
          email: selected?.email ?? newEmail,
        },
        items: parsedItems,
        discount: Number(discount) || 0,
        payment_method: method,
        payment_status: status,
        notes,
      });
      router.push(`/receipts/${receipt.receipt_number}`);
    } catch {
      setError("Something went wrong while issuing the receipt. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={duplicateOf ? "Duplicate Receipt" : "New Receipt"}
        description={
          prefilling
            ? "Loading receipt details…"
            : duplicateOf
              ? `Copied from ${duplicateOf} — review before issuing.`
              : "Customer first, then items — totals update as you type."
        }
      />

      <form onSubmit={submit} className="pb-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* ================= Left column ================= */}
          <div className="space-y-6">
            {/* ---- Customer ---- */}
            <Card>
              <CardHeader
                title="Customer"
                description="Search a saved customer, or type a name to create one."
              />
              <CardBody>
                {selected ? (
                  <div className="flex items-center justify-between gap-3 rounded-control border border-brand-gold/30 bg-brand-gold/[0.07] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-ink">
                        {selected.name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {[selected.phone, selected.email].filter(Boolean).join(" · ") ||
                          "No contact details"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelected(null);
                        setQuery("");
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Field
                        label="Find or create customer"
                        hint={
                          matches.length > 0
                            ? "Pick a saved customer, or keep typing to create a new one."
                            : "Names not in your list will become a new customer."
                        }
                      >
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold"
                            strokeWidth={2}
                          />
                          <TextInput
                            value={query}
                            onChange={(event) => {
                              setQuery(event.target.value);
                              setPickerOpen(true);
                            }}
                            onFocus={() => setPickerOpen(true)}
                            onBlur={() => setTimeout(() => setPickerOpen(false), 120)}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") setPickerOpen(false);
                            }}
                            placeholder="e.g. Chiamaka Obi or 0803…"
                            autoComplete="off"
                            className="pl-10"
                          />
                        </div>
                      </Field>

                      {pickerOpen && matches.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-control border border-brand-gold/25 bg-white py-1">
                          {matches.map((customer) => (
                            <li key={customer.id}>
                              <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  setSelected({
                                    id: customer.id,
                                    name: customer.name,
                                    phone: customer.phone ?? undefined,
                                    email: customer.email ?? undefined,
                                  });
                                  setQuery("");
                                  setPickerOpen(false);
                                }}
                                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-gold/10"
                              >
                                <span className="text-sm font-medium text-ink">
                                  {customer.name}
                                </span>
                                <span className="text-xs text-muted">
                                  {customer.phone}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Phone (optional)">
                        <TextInput
                          value={newPhone}
                          onChange={(event) => setNewPhone(event.target.value)}
                          placeholder="+234 800 000 0000"
                          type="tel"
                        />
                      </Field>
                      <Field label="Email (optional)">
                        <TextInput
                          value={newEmail}
                          onChange={(event) => setNewEmail(event.target.value)}
                          placeholder="customer@email.com"
                          type="email"
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* ---- Items ---- */}
            <Card>
              <CardHeader
                title="Items"
                description="Description, quantity, price — line totals are automatic."
                action={
                  <Button size="sm" variant="outline" onClick={addRow}>
                    <Plus className="h-4 w-4" strokeWidth={2.4} />
                    Add item
                  </Button>
                }
              />
              <CardBody>
                {/* Desktop column labels */}
                <div className="hidden gap-3 border-b border-brand-gold/15 pb-2.5 sm:grid sm:grid-cols-[1fr_84px_132px_132px_40px]">
                  {["Description", "Qty", "Unit Price", "Line Total"].map(
                    (label, index) => (
                      <span
                        key={label}
                        className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-muted ${
                          index >= 1 ? "text-right" : ""
                        }`}
                      >
                        {label}
                      </span>
                    ),
                  )}
                  <span />
                </div>

                <div className="mt-4 space-y-4 sm:mt-3 sm:space-y-3">
                  {rows.map((row) => {
                    const invalid =
                      row.description.trim() !== "" &&
                      (Number(row.quantity) < 1 || Number(row.unitPrice) < 0);
                    const total = lineTotal({
                      description: row.description,
                      quantity: Number(row.quantity) || 0,
                      unit_price: Number(row.unitPrice) || 0,
                    });

                    return (
                      <div
                        key={row.key}
                        className="grid gap-3 rounded-[10px] border border-brand-gold/15 bg-white/50 p-3 sm:border-0 sm:bg-transparent sm:p-0 sm:grid-cols-[1fr_84px_132px_132px_40px] sm:items-center"
                      >
                        {/* Description (+ mobile remove) */}
                        <div className="relative">
                          <TextInput
                            value={row.description}
                            onChange={(event) =>
                              updateRow(row.key, { description: event.target.value })
                            }
                            placeholder="e.g. Custom Ankara Gown"
                            aria-label="Item description"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            aria-label="Remove item"
                            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-muted/10 hover:text-ink sm:hidden"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>

                        {/* Qty + price (stacked on mobile) */}
                        <div className="grid grid-cols-2 gap-3 sm:contents">
                          <TextInput
                            value={row.quantity}
                            onChange={(event) =>
                              updateRow(row.key, { quantity: event.target.value })
                            }
                            type="number"
                            min={1}
                            step="1"
                            inputMode="numeric"
                            aria-label="Quantity"
                            className="text-center sm:text-right"
                          />
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                              {currency === "NGN" ? "₦" : currency}
                            </span>
                            <TextInput
                              value={row.unitPrice}
                              onChange={(event) =>
                                updateRow(row.key, { unitPrice: event.target.value })
                              }
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              aria-label="Unit price"
                              className="pl-8 sm:text-right"
                            />
                          </div>
                        </div>

                        {/* Line total */}
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:hidden">
                            Line total
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-gold-deep">
                            {formatMoney(total, currency)}
                          </span>
                        </div>

                        {/* Desktop remove */}
                        <div className="hidden place-items-center sm:grid">
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            aria-label="Remove item"
                            className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-muted/10 hover:text-ink"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>

                        {invalid && (
                          <p className="text-xs text-gold-deep sm:col-span-5">
                            Quantity must be at least 1 and price cannot be negative.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* ---- Discount ---- */}
            <Card>
              <CardHeader
                title="Discount"
                description="Optional — leave blank for none."
              />
              <CardBody>
                <Field label="Discount" hint="Amount off the subtotal">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                      {currency === "NGN" ? "₦" : currency}
                    </span>
                    <TextInput
                      value={discount}
                      onChange={(event) => setDiscount(event.target.value)}
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0"
                      className="pl-8"
                    />
                  </div>
                </Field>
              </CardBody>
            </Card>

            {/* ---- Payment ---- */}
            <Card>
              <CardHeader
                title="Payment"
                description="How the customer paid, and where things stand."
              />
              <CardBody className="space-y-5">
                <div>
                  <p className="mb-2.5 text-[13px] font-medium text-ink">
                    Payment method
                  </p>
                  <SegmentedControl
                    options={METHOD_OPTIONS}
                    value={method}
                    onChange={setMethod}
                    ariaLabel="Payment method"
                  />
                </div>
                <div>
                  <p className="mb-2.5 text-[13px] font-medium text-ink">
                    Payment status
                  </p>
                  <SegmentedControl
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={setStatus}
                    ariaLabel="Payment status"
                  />
                </div>
              </CardBody>
            </Card>

            {/* ---- Notes ---- */}
            <Card>
              <CardHeader
                title="Notes"
                description="Optional message printed on the receipt."
              />
              <CardBody>
                <TextArea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Balance due on delivery, pickup date, thank-you note…"
                  aria-label="Receipt notes"
                />
              </CardBody>
            </Card>
          </div>

          {/* ================= Right column: live summary ================= */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Card>
                <CardHeader title="Summary" />
                <CardBody>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-muted">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums text-ink">
                        {formatMoney(totals.subtotal, currency)}
                      </dd>
                    </div>
                    <div className="flex justify-between text-muted">
                      <dt>Discount</dt>
                      <dd className="tabular-nums text-ink">
                        {totals.discount > 0 ? "− " : ""}
                        {formatMoney(totals.discount, currency)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 h-px w-full bg-brand-gold/40" />

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
                      Total
                    </span>
                    <span className="text-[32px] font-semibold leading-none tabular-nums text-brand-gold">
                      {formatMoney(totals.total, currency)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    {parsedItems.length} item{parsedItems.length === 1 ? "" : "s"}
                    {customerName ? ` · ${customerName}` : " · No customer yet"}
                  </p>

                  {error && <p className="mt-3 text-xs text-gold-deep">{error}</p>}

                  <Button
                    type="submit"
                    size="lg"
                    className="mt-5 w-full"
                    disabled={!canSubmit}
                  >
                    {submitting
                      ? "Issuing…"
                      : prefilling
                        ? "Loading…"
                        : "Issue Receipt"}
                  </Button>

                  <p className="mt-3 text-center text-[11px] text-muted">
                    Issuing assigns a unique receipt number.
                  </p>
                </CardBody>
              </Card>
            </div>
          </aside>
        </div>

        {/* ---- Mobile sticky action bar ---- */}
        <div
          className="fixed inset-x-0 z-30 flex items-center justify-between gap-4 border-t border-brand-gold/20 bg-surface/95 px-4 backdrop-blur lg:hidden"
          style={{
            bottom: "calc(4rem + env(safe-area-inset-bottom))",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
          }}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Total
            </div>
            <div className="mt-0.5 truncate text-xl font-semibold tabular-nums text-brand-gold">
              {formatMoney(totals.total, currency)}
            </div>
          </div>
          <Button type="submit" size="lg" disabled={!canSubmit} className="shrink-0">
            {submitting ? "Issuing…" : "Issue Receipt"}
          </Button>
        </div>
      </form>
    </>
  );
}
