"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatMoney, initials } from "@/lib/format";
import type { Customer, Receipt } from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput } from "@/components/ui/Field";
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
  /** Currency only — the organization itself rides on the session. */
  const business = useSession().session?.business ?? null;
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveTouched, setSaveTouched] = useState(false);

  function fetchAll() {
    return Promise.all([api.getCustomers(), api.getReceipts()]);
  }

  async function load() {
    const [customerList, receiptList] = await fetchAll();
    setCustomers(customerList);
    setReceipts(receiptList);
  }

  useEffect(() => {
    let cancelled = false;
    fetchAll().then(([customerList, receiptList]) => {
      if (cancelled) return;
      setCustomers(customerList);
      setReceipts(receiptList);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    await api.createCustomer({
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
    });
    setSaving(false);
    setModalOpen(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setSaveTouched(false);
    await load();
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
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold"
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customers…"
          aria-label="Search customers"
          className="h-11 w-full rounded-control border border-brand-gold/25 bg-white pl-10 pr-4 text-[15px] text-ink transition-colors placeholder:text-muted/55 focus:border-brand-gold"
        />
      </div>

      {/* List */}
      <Card>
        <CardBody padded={false}>
          {!filtered ? (
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
                  className="flex w-full items-center gap-4 border-b border-brand-gold/10 px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-brand-gold/[0.06] focus-visible:bg-brand-gold/[0.06]"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-black text-sm font-semibold text-brand-gold"
                    aria-hidden
                  >
                    {initials(customer.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">
                      {customer.name}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {[customer.phone, customer.email].filter(Boolean).join(" · ") ||
                        "No contact details"}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm font-semibold tabular-nums text-ink">
                      {formatMoney(stats.total, business?.currency ?? "NGN")}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {stats.count} receipt{stats.count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted"
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
            className="absolute inset-0 h-full w-full cursor-default bg-brand-black/45"
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-brand-gold/25 bg-cream">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-brand-gold/15 bg-cream px-6 py-5">
              <div className="flex items-center gap-4">
                <span
                  className="grid h-12 w-12 place-items-center rounded-full bg-brand-black text-base font-semibold text-brand-gold"
                  aria-hidden
                >
                  {initials(selected.name)}
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-ink">
                    {selected.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">Customer details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-brand-gold/10 hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5">
              {/* Contact */}
              <div className="space-y-3">
                {selected.phone && (
                  <div className="flex items-center gap-3 text-sm text-ink">
                    <Phone className="h-4 w-4 text-brand-gold" strokeWidth={1.8} />
                    {selected.phone}
                  </div>
                )}
                {selected.email && (
                  <div className="flex items-center gap-3 text-sm text-ink">
                    <Mail className="h-4 w-4 text-brand-gold" strokeWidth={1.8} />
                    {selected.email}
                  </div>
                )}
                {!selected.phone && !selected.email && (
                  <p className="text-sm text-muted">No contact details on file.</p>
                )}
              </div>

              {/* Stats */}
              {selectedStats && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-card border border-brand-gold/25 bg-brand-black p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-cream/55">
                      Receipts
                    </div>
                    <div className="mt-2 text-xl font-semibold text-brand-gold">
                      {selectedStats.count}
                    </div>
                  </div>
                  <div className="rounded-card border border-brand-gold/25 bg-brand-black p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-cream/55">
                      Lifetime
                    </div>
                    <div className="mt-2 truncate text-xl font-semibold text-brand-gold">
                      {formatMoney(selectedStats.total, business?.currency ?? "NGN")}
                    </div>
                  </div>
                </div>
              )}

              {/* Their receipts */}
              <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                Receipts
              </h3>
              <div className="mt-3 space-y-2">
                {selectedReceipts.length === 0 ? (
                  <p className="text-sm text-muted">No receipts yet.</p>
                ) : (
                  selectedReceipts.map((receipt) => (
                    <button
                      key={receipt.id}
                      type="button"
                      onClick={() => {
                        router.push(`/receipts/${receipt.receipt_number}`);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-control border border-brand-gold/15 bg-surface px-4 py-3 text-left transition-colors hover:border-brand-gold/40 hover:bg-brand-gold/[0.06]"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium tabular-nums text-ink">
                          {receipt.receipt_number}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {formatDate(receipt.issue_date)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span
                          className={`text-sm font-semibold tabular-nums text-ink ${
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

            <div className="sticky bottom-0 border-t border-brand-gold/15 bg-cream px-6 py-4">
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
          }
        }}
      >
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
            <p className="text-xs text-gold-deep">Please enter the customer’s name.</p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
