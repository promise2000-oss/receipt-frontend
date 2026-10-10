"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { api, readableError } from "@/lib/api";
import { formatDate, formatMoney, initials } from "@/lib/format";
import type { Customer, Receipt } from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { LoadError } from "@/components/ui/LoadError";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CustomerStats {
  count: number;
  total: number;
}

export function CustomersView() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Bumped by "Try again" — a failed read should be recoverable in place. */
  const [attempt, setAttempt] = useState(0);
  /** Failures creating a customer belong in the open dialog, not the list. */
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Currency only — the organization itself rides on the session. */
  const business = useSession().session?.business ?? null;
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const [saveTouched, setSaveTouched] = useState(false);

  function fetchAll() {
    return Promise.all([api.getCustomers(), api.getReceipts()]);
  }

  async function load() {
    const [customerList, receiptList] = await fetchAll();
    setCustomers(customerList);
    setReceipts(receiptList);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then(([customerList, receiptList]) => {
        if (cancelled) return;
        setCustomers(customerList);
        setReceipts(receiptList);
        setError(null);
      })
      .catch((caught: unknown) => {
        // Both reads used to be dropped on the floor, so an unreachable API
        // left the list on its skeleton and reported nothing.
        if (cancelled) return;
        setError(readableError(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    // An event handler, not an effect: dropping the message here is what makes
    // the skeleton reappear instead of the stale failure.
    setError(null);
    setAttempt((value) => value + 1);
  }

  const statsById = useMemo(() => {
    const map = new Map<string, CustomerStats>();
    for (const receipt of receipts) {
      if (!receipt.customer_id) continue;
      const entry = map.get(receipt.customer_id) ?? { count: 0, total: 0 };
      entry.count += 1;
      if (receipt.status === "active") entry.total += receipt.total;
      map.set(receipt.customer_id, entry);
    }
    return map;
  }, [receipts]);

  const filtered = useMemo(() => {
    if (!customers) return null;
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) ||
        (customer.phone ?? "").toLowerCase().includes(needle) ||
        (customer.email ?? "").toLowerCase().includes(needle),
    );
  }, [customers, query]);

  const selectedReceipts = selected
    ? receipts
        .filter((receipt) => receipt.customer_id === selected.id)
        .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
    : [];

  const selectedStats = selected ? statsById.get(selected.id) ?? { count: 0, total: 0 } : null;

  async function saveCustomer() {
    setSaveTouched(true);
    if (newName.trim().length < 2 || saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      await api.createCustomer({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      });
    } catch (caught) {
      // Keep the dialog open: a failure the reader can't see next to the form
      // that caused it is worse than no message, and the confirm button must
      // not stay stuck disabled either.
      setSaveError(readableError(caught));
      setSaving(false);
      return;
    }

    // Named, because "a customer called that" is otherwise unfindable in a
    // long list, and a silent close reads as a failed save.
    toast.success(`${newName.trim()} added to your customers.`);
    setModalOpen(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setSaveTouched(false);
    setSaving(false);

    try {
      await load();
    } catch (caught) {
      // The customer exists — only the list's view of it is stale, so this
      // belongs to the list rather than to a dialog that has already closed.
      setError(readableError(caught));
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Saved customers make the next receipt faster."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" strokeWidth={2} />
            New customer
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-5 w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vg-text-muted"
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customers…"
          aria-label="Search customers"
          className="h-11 w-full rounded-control border border-vg-border bg-vg-surface-2 pl-10 pr-4 text-[15px] text-vg-white transition-colors placeholder:text-vg-placeholder focus:control-focus focus:outline-none"
        />
      </div>

      {/* List */}
      <Card>
        <CardBody padded={false}>
          {error && !filtered ? (
            <LoadError message={error} onRetry={retry} />
          ) : !filtered ? (
            <ListSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            query ? (
              <EmptyState
                title="No matching customers"
                description="Try a different name, phone number, or email."
                action={
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No customers yet"
                description="Customers are saved automatically the first time you issue them a receipt — or add one now."
                action={
                  <Button onClick={() => setModalOpen(true)}>
                    <UserPlus className="h-4 w-4" strokeWidth={2} />
                    New customer
                  </Button>
                }
              />
            )
          ) : (
            filtered.map((customer) => {
              const stats = statsById.get(customer.id) ?? { count: 0, total: 0 };
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelected(customer)}
                  className="flex w-full items-center gap-4 border-b border-vg-border px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-vg-row-hover focus-visible:bg-vg-row-hover"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-vg-red-900 text-sm font-semibold text-vg-white"
                    aria-hidden
                  >
                    {initials(customer.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-vg-white">
                      {customer.name}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-vg-text-muted">
                      {[customer.phone, customer.email].filter(Boolean).join(" · ") ||
                        "No contact details"}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm font-semibold tabular-nums text-vg-white">
                      {formatMoney(stats.total, business?.currency ?? "NGN")}
                    </span>
                    <span className="mt-0.5 block text-xs text-vg-text-muted">
                      {stats.count} receipt{stats.count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-vg-text-muted"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              );
            })
          )}
        </CardBody>
      </Card>

      {/* ---- Detail drawer ---- */}
      {selected && (
        <div className="no-print fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close customer details"
            onClick={() => setSelected(null)}
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ backgroundColor: "var(--vg-overlay)" }}
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-vg-border bg-vg-surface-1">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-vg-border bg-vg-surface-1 px-6 py-5">
              <div className="flex items-center gap-4">
                <span
                  className="grid h-12 w-12 place-items-center rounded-full bg-vg-red-900 text-base font-semibold text-vg-white"
                  aria-hidden
                >
                  {initials(selected.name)}
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-vg-white">
                    {selected.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-vg-text-muted">Customer details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-vg-text-muted transition-colors hover:bg-vg-surface-3 hover:text-vg-white"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5">
              {/* Contact */}
              <div className="space-y-3">
                {selected.phone && (
                  <div className="flex items-center gap-3 text-sm text-vg-white">
                    <Phone className="h-4 w-4 text-vg-orange-red" strokeWidth={1.8} />
                    {selected.phone}
                  </div>
                )}
                {selected.email && (
                  <div className="flex items-center gap-3 text-sm text-vg-white">
                    <Mail className="h-4 w-4 text-vg-orange-red" strokeWidth={1.8} />
                    {selected.email}
                  </div>
                )}
                {!selected.phone && !selected.email && (
                  <p className="text-sm text-vg-text-muted">No contact details on file.</p>
                )}
              </div>

              {/* Stats */}
              {selectedStats && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-card border border-vg-border bg-vg-surface-2 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-vg-text-muted">
                      Receipts
                    </div>
                    <div className="mt-2 text-xl font-semibold text-vg-white">
                      {selectedStats.count}
                    </div>
                  </div>
                  <div className="rounded-card border border-vg-border bg-vg-surface-2 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-vg-text-muted">
                      Lifetime
                    </div>
                    <div className="mt-2 truncate text-xl font-semibold text-vg-white">
                      {formatMoney(selectedStats.total, business?.currency ?? "NGN")}
                    </div>
                  </div>
                </div>
              )}

              {/* Their receipts */}
              <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-vg-text-muted">
                Receipts
              </h3>
              <div className="mt-3 space-y-2">
                {selectedReceipts.length === 0 ? (
                  <p className="text-sm text-vg-text-muted">No receipts yet.</p>
                ) : (
                  selectedReceipts.map((receipt) => (
                    <button
                      key={receipt.id}
                      type="button"
                      onClick={() => {
                        router.push(`/receipts/${receipt.receipt_number}`);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-control border border-vg-border bg-vg-surface-2 px-4 py-3 text-left transition-colors hover:border-vg-red-900 hover:bg-vg-row-hover"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium tabular-nums text-vg-white">
                          {receipt.receipt_number}
                        </span>
                        <span className="mt-0.5 block text-xs text-vg-text-muted">
                          {formatDate(receipt.issue_date)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span
                          className={`text-sm font-semibold tabular-nums text-vg-white ${
                            receipt.status === "void" ? "line-through" : ""
                          }`}
                        >
                          {formatMoney(receipt.total, business?.currency ?? "NGN")}
                        </span>
                        <StatusBadge
                          tone={
                            receipt.status === "void"
                              ? "void"
                              : receipt.payment_status
                          }
                        />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-vg-border bg-vg-surface-1 px-6 py-4">
              <ButtonLink
                href={`/receipts/new?customer=${selected.id}`}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                New receipt for {selected.name.split(" ")[0]}
              </ButtonLink>
            </div>
          </aside>
        </div>
      )}

      {/* ---- New customer modal ---- */}
      <ConfirmDialog
        open={modalOpen}
        title="New customer"
        description="Save their details once — issue receipts to them faster next time."
        confirmLabel={saving ? "Saving…" : "Save customer"}
        busy={saving}
        onConfirm={saveCustomer}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setSaveTouched(false);
            setSaveError(null);
          }
        }}
      >
        {saveError && (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-control border border-vg-error bg-vg-error/12 px-3 py-2.5 text-sm leading-relaxed text-vg-error"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{saveError}</span>
          </p>
        )}
        <div className="space-y-3">
          <Field label="Full name" required>
            <TextInput
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Chiamaka Obi"
              autoFocus
            />
          </Field>
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
          {saveTouched && newName.trim().length < 2 && (
            <p className="flex items-center gap-1.5 text-xs text-vg-error">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Please enter the customer’s name.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
