"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { computeTotals, lineTotal } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import type { Customer, InvoiceInput } from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";

/**
 * The invoice builder.
 *
 * Mirrors `ReceiptForm` deliberately — same layout, same line editor, same
 * validation feel — because a user who has learned one has learned the other,
 * and the two documents differ in the *financial* rules, not the interaction.
 *
 * What is genuinely different, and deliberate:
 *
 *  - **Tax rate** exists here (receipts dropped it), because an invoice is
 *    exactly where a business declares VAT.
 *  - **Due date, terms and PO reference** appear only once issued.
 *  - **Draft vs. issue** is the submit button's decision, not an implicit
 *    side effect. Creating an invoice never marks it paid.
 *  - The totals shown are a *preview*. The server recomputes every figure on
 *    create; this is here so the user can see what they are about to commit to,
 *    not to be a source of truth.
 */

interface ItemRow {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

const newRow = (key: string): ItemRow => ({
  key,
  description: "",
  quantity: "1",
  unitPrice: "",
});

/** `YYYY-MM-DD` in the browser's own timezone, for `<input type="date">`. */
function isoDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function InvoiceForm() {
  const router = useRouter();
  const currency = useSession().session?.business.currency ?? "NGN";

  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [taxRate, setTaxRate] = useState("");
  const [dueDate, setDueDate] = useState(isoDate(30));
  const [terms, setTerms] = useState("Net 30");
  const [poReference, setPoReference] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState<"draft" | "issue" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await api.getCustomers();
      if (!cancelled) setCustomers(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const customerName = selected ? selected.name : query.trim();

  const parsedItems = rows
    .filter((row) => row.description.trim() !== "")
    .map((row) => ({
      description: row.description.trim(),
      quantity: Number(row.quantity) || 0,
      unit_price: Number(row.unitPrice) || 0,
    }));

  const totals = computeTotals(parsedItems, Number(discount) || 0, Number(taxRate) || 0);

  const itemsValid =
    parsedItems.length > 0 &&
    parsedItems.every((item) => item.quantity >= 1 && item.unit_price >= 0);

  const canSubmit = submitting === null && customerName !== "" && itemsValid;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(needle) ||
          (customer.phone ?? "").toLowerCase().includes(needle),
      )
      .slice(0, 6);
  }, [customers, query]);

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

  async function submit(issue: boolean) {
    if (!canSubmit) return;
    setSubmitting(issue ? "issue" : "draft");
    setError(null);

    const input: InvoiceInput = {
      customer: {
        id: selected?.id,
        name: customerName,
        phone: selected?.phone ?? newPhone,
        email: selected?.email ?? newEmail,
      },
      items: parsedItems,
      discount: Number(discount) || 0,
      tax_rate: Number(taxRate) || 0,
      notes,
      terms,
      po_reference: poReference,
      due_date: dueDate || null,
      issue,
    };

    try {
      const invoice = await api.createInvoice(input);
      router.push(`/invoices/${invoice.invoice_number}`);
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "Something went wrong while creating the invoice. Please try again.",
      );
      setSubmitting(null);
    }
  }

  const submitLabel = submitting === "issue" ? "Issuing…" : "Saving…";

  return (
    <>
      <PageHeader
        title="New Invoice"
        description="Bill a customer now, collect payment later — or save a draft to finish later."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(false);
        }}
        className="pb-4"
      >
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
                  <div className="flex items-center justify-between gap-3 rounded-control border border-vg-red-900 bg-vg-red-900/12 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-vg-white">
                        {selected.name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-vg-text-muted">
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
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vg-text-muted"
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
                        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-control border border-vg-border bg-vg-surface-1 py-1">
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
                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-vg-surface-2"
                              >
                                <span className="text-sm font-medium text-vg-white">
                                  {customer.name}
                                </span>
                                <span className="text-xs text-vg-text-muted">
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
                  <Button size="sm" variant="outline" onClick={() => addRow()}>
                    <Plus className="h-4 w-4" strokeWidth={2.4} />
                    Add item
                  </Button>
                }
              />
              <CardBody>
                <div className="hidden gap-3 border-b border-vg-border pb-2.5 sm:grid sm:grid-cols-[1fr_84px_132px_132px_40px]">
                  {["Description", "Qty", "Unit Price", "Line Total"].map(
                    (label, index) => (
                      <span
                        key={label}
                        className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-vg-text-muted ${
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
                        className="grid gap-3 rounded-control border border-vg-border bg-vg-surface-1 p-3 sm:border-0 sm:bg-transparent sm:p-0 sm:grid-cols-[1fr_84px_132px_132px_40px] sm:items-center"
                      >
                        <div className="relative">
                          <TextInput
                            value={row.description}
                            onChange={(event) =>
                              updateRow(row.key, { description: event.target.value })
                            }
                            placeholder="e.g. Brand identity design"
                            aria-label="Item description"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            aria-label="Remove item"
                            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-vg-text-muted transition-colors hover:bg-vg-surface-3 hover:text-vg-white sm:hidden"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>

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
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-vg-text-muted">
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

                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vg-text-muted sm:hidden">
                            Line total
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-vg-accent-text">
                            {formatMoney(total, currency)}
                          </span>
                        </div>

                        <div className="hidden place-items-center sm:grid">
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            aria-label="Remove item"
                            className="grid h-9 w-9 place-items-center rounded-full text-vg-text-muted transition-colors hover:bg-vg-surface-3 hover:text-vg-white"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>

                        {invalid && (
                          <p className="text-xs text-vg-error sm:col-span-5">
                            Quantity must be at least 1 and price cannot be negative.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* ---- Tax & discount ---- */}
            <Card>
              <CardHeader
                title="Tax & discount"
                description="Applied to the subtotal before the total is calculated."
              />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="Tax rate" hint="Percent, e.g. 7.5 for 7.5% VAT. Leave blank for none.">
                  <TextInput
                    value={taxRate}
                    onChange={(event) => setTaxRate(event.target.value)}
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                  />
                </Field>
                <Field label="Discount" hint="Amount off the subtotal">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-vg-text-muted">
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

            {/* ---- Payment terms ---- */}
            <Card>
              <CardHeader
                title="Payment terms"
                description="Printed on the invoice. A due date before the issue date is rejected."
              />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="Due date">
                  <TextInput
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    type="date"
                  />
                </Field>
                <Field label="Terms" hint="e.g. Net 30, or payment on delivery">
                  <TextInput
                    value={terms}
                    onChange={(event) => setTerms(event.target.value)}
                    placeholder="Net 30"
                  />
                </Field>
                <Field label="PO reference (optional)" hint="Your customer's purchase-order number">
                  <TextInput
                    value={poReference}
                    onChange={(event) => setPoReference(event.target.value)}
                    placeholder="PO-2026-0142"
                  />
                </Field>
              </CardBody>
            </Card>

            {/* ---- Notes ---- */}
            <Card>
              <CardHeader
                title="Notes"
                description="Optional message printed on the invoice."
              />
              <CardBody>
                <TextArea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Bank details, delivery terms, thank-you note…"
                  aria-label="Invoice notes"
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
                    <div className="flex justify-between text-vg-text-muted">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums text-vg-white">
                        {formatMoney(totals.subtotal, currency)}
                      </dd>
                    </div>
                    <div className="flex justify-between text-vg-text-muted">
                      <dt>Discount</dt>
                      <dd className="tabular-nums text-vg-white">
                        {totals.discount > 0 ? "− " : ""}
                        {formatMoney(totals.discount, currency)}
                      </dd>
                    </div>
                    {totals.tax > 0 && (
                      <div className="flex justify-between text-vg-text-muted">
                        <dt>Tax ({(Number(taxRate) || 0).toFixed(2).replace(/\.?0+$/, "")}%)</dt>
                        <dd className="tabular-nums text-vg-white">
                          {formatMoney(totals.tax, currency)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-4 h-px w-full bg-vg-border" />

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-vg-white">
                      Total
                    </span>
                    <span className="text-[32px] font-semibold leading-none tabular-nums text-vg-white">
                      {formatMoney(totals.total, currency)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-vg-text-muted">
                    {parsedItems.length} item{parsedItems.length === 1 ? "" : "s"}
                    {customerName ? ` · ${customerName}` : " · No customer yet"}
                  </p>

                  {error && (
                    <p role="alert" className="mt-3 flex items-start gap-1.5 text-xs text-vg-error">
                      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{error}</span>
                    </p>
                  )}

                  <div className="mt-5 space-y-2">
                    <Button
                      type="button"
                      size="lg"
                      className="w-full"
                      disabled={!canSubmit}
                      onClick={() => submit(true)}
                    >
                      {submitting === "issue" ? "Issuing…" : "Issue Invoice"}
                    </Button>
                    <Button
                      type="submit"
                      size="md"
                      variant="outline"
                      className="w-full"
                      disabled={!canSubmit}
                    >
                      {submitting === "draft" ? submitLabel : "Save as Draft"}
                    </Button>
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed text-vg-text-muted">
                    A draft stays editable. Issuing assigns the invoice number and
                    freezes the figures — payments can then be recorded against it.
                  </p>
                </CardBody>
              </Card>
            </div>
          </aside>
        </div>

        {/* ---- Mobile sticky action bar ---- */}
        <div
          className="fixed inset-x-0 z-30 flex items-center justify-between gap-4 border-t border-vg-border bg-vg-surface-1/95 px-4 backdrop-blur lg:hidden"
          style={{
            bottom: "calc(4rem + env(safe-area-inset-bottom))",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
          }}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-vg-text-muted">
              Total
            </div>
            <div className="mt-0.5 truncate text-xl font-semibold tabular-nums text-vg-white">
              {formatMoney(totals.total, currency)}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="submit"
              size="md"
              variant="outline"
              disabled={!canSubmit}
            >
              Draft
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={!canSubmit}
              onClick={() => submit(true)}
            >
              {submitting === "issue" ? "Issuing…" : "Issue"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}