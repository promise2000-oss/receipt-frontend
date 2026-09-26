import { computeTotals, round2 } from "./calc";
import { createSeedState } from "./seed";
import type {
  Business,
  Customer,
  DashboardSummary,
  Receipt,
  ReceiptFilters,
  ReceiptInput,
} from "./types";

/**
 * API-shaped mock client — mirrors the TRD §3.1 endpoints so the UI can
 * later swap this module for real REST calls without component changes.
 *
 *   GET    /business/me        -> getBusiness()
 *   PATCH  /business/me        -> updateBusiness()
 *   GET    /customers          -> getCustomers()
 *   POST   /customers          -> createCustomer()
 *   GET    /receipts           -> getReceipts()
 *   GET    /receipts/:id       -> getReceipt()
 *   POST   /receipts           -> createReceipt()
 *   PATCH  /receipts/:id/void  -> voidReceipt()
 *   GET    /dashboard/summary  -> getDashboardSummary()
 */

const STORAGE_KEY = "eleosstyles.receipt-system.v1";
const LATENCY_MS = 260;

interface State {
  business: Business;
  customers: Customer[];
  receipts: Receipt[];
}

let memoryState: State | null = null;

const hasWindow = () => typeof window !== "undefined";

function persist(state: State): void {
  memoryState = state;
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

function loadState(): State {
  if (memoryState) return memoryState;
  if (hasWindow()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryState = JSON.parse(raw) as State;
        return memoryState;
      }
    } catch {
      /* fall through to seed */
    }
  }
  memoryState = createSeedState();
  persist(memoryState);
  return memoryState;
}

const wait = (ms: number = LATENCY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function nextReceiptNumber(receipts: Receipt[]): string {
  const max = receipts.reduce((highest, receipt) => {
    const value = Number(receipt.receipt_number.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return `ES-${String(max + 1).padStart(6, "0")}`;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date): Date {
  const copy = startOfDay(date);
  const weekday = copy.getDay(); // 0 = Sunday
  const daysSinceMonday = (weekday + 6) % 7;
  copy.setDate(copy.getDate() - daysSinceMonday);
  return copy;
}

function startOfMonth(date: Date): Date {
  const copy = startOfDay(date);
  copy.setDate(1);
  return copy;
}

function within(iso: string, since: Date): boolean {
  return new Date(iso).getTime() >= since.getTime();
}

export const api = {
  /* ---------------- Business ---------------- */

  async getBusiness(): Promise<Business> {
    await wait();
    return { ...loadState().business };
  },

  async updateBusiness(patch: Partial<Business>): Promise<Business> {
    await wait(220);
    const state = loadState();
    const business = { ...state.business, ...patch };
    persist({ ...state, business });
    return { ...business };
  },

  /* ---------------- Customers ---------------- */

  async getCustomers(): Promise<Customer[]> {
    await wait();
    return [...loadState().customers].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  },

  async createCustomer(
    input: Pick<Customer, "name"> & Partial<Pick<Customer, "phone" | "email">>,
  ): Promise<Customer> {
    await wait(200);
    const state = loadState();
    const customer: Customer = {
      id: `c_${crypto.randomUUID().slice(0, 8)}`,
      business_id: state.business.id,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      created_at: new Date().toISOString(),
    };
    persist({ ...state, customers: [...state.customers, customer] });
    return customer;
  },

  /* ---------------- Receipts ---------------- */

  async getReceipts(filters: ReceiptFilters = {}): Promise<Receipt[]> {
    await wait();
    const now = new Date();
    const query = filters.q?.trim().toLowerCase();
    const chip = filters.chip ?? "all";

    return loadState()
      .receipts.filter((receipt) => {
        if (chip === "void" && receipt.status !== "void") return false;
        if (chip !== "all" && chip !== "void") {
          if (receipt.status !== "active" || receipt.payment_status !== chip) {
            return false;
          }
        }
        if (filters.period === "today" && !within(receipt.issue_date, startOfDay(now))) {
          return false;
        }
        if (filters.period === "week" && !within(receipt.issue_date, startOfWeek(now))) {
          return false;
        }
        if (filters.period === "month" && !within(receipt.issue_date, startOfMonth(now))) {
          return false;
        }
        if (query) {
          const haystack = [
            receipt.customer_name,
            receipt.receipt_number,
            receipt.total.toFixed(2),
            receipt.items.map((item) => item.description).join(" "),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => b.issue_date.localeCompare(a.issue_date));
  },

  async getReceipt(id: string): Promise<Receipt | null> {
    await wait();
    const receipt = loadState().receipts.find(
      (item) => item.id === id || item.receipt_number === id,
    );
    return receipt ? { ...receipt, items: [...receipt.items] } : null;
  },

  async createReceipt(input: ReceiptInput): Promise<Receipt> {
    await wait(420);
    const state = loadState();

    // Resolve an existing customer (by id, phone, or name) or create one.
    const normalise = (value: string | undefined) => (value ?? "").replace(/\s+/g, "").toLowerCase();
    let customer = state.customers.find(
      (item) =>
        (input.customer.id && item.id === input.customer.id) ||
        (input.customer.phone && item.phone && normalise(item.phone) === normalise(input.customer.phone)) ||
        normalise(item.name) === normalise(input.customer.name),
    );

    if (!customer) {
      customer = {
        id: `c_${crypto.randomUUID().slice(0, 8)}`,
        business_id: state.business.id,
        name: input.customer.name.trim(),
        phone: input.customer.phone?.trim() || null,
        email: input.customer.email?.trim() || null,
        created_at: new Date().toISOString(),
      };
    }

    const receiptNumber = nextReceiptNumber(state.receipts);
    const totals = computeTotals(input.items, input.discount, input.tax_rate);
    const now = new Date().toISOString();

    const receipt: Receipt = {
      id: receiptNumber,
      business_id: state.business.id,
      customer_id: customer.id,
      receipt_number: receiptNumber,
      issue_date: now,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      items: input.items.map((item, index) => ({
        id: `${receiptNumber}-i${index + 1}`,
        receipt_id: receiptNumber,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unit_price: round2(Number(item.unit_price)),
        line_total: round2(Number(item.quantity) * Number(item.unit_price)),
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      payment_method: input.payment_method,
      payment_status: input.payment_status,
      status: "active",
      void_note: null,
      voided_at: null,
      notes: input.notes?.trim() || null,
      created_by: "u_01_owner",
      created_at: now,
    };

    const customers = state.customers.some((item) => item.id === customer!.id)
      ? state.customers
      : [...state.customers, customer];

    persist({ ...state, customers, receipts: [...state.receipts, receipt] });
    return { ...receipt, items: [...receipt.items] };
  },

  async voidReceipt(id: string, note: string): Promise<Receipt | null> {
    await wait(300);
    const state = loadState();
    const receipt = state.receipts.find(
      (item) => item.id === id || item.receipt_number === id,
    );
    if (!receipt) return null;

    receipt.status = "void";
    receipt.void_note = note;
    receipt.voided_at = new Date().toISOString();
    persist({ ...state });
    return { ...receipt };
  },

  /* ---------------- Dashboard ---------------- */

  async getDashboardSummary(): Promise<DashboardSummary> {
    await wait();
    const state = loadState();
    const now = new Date();
    const windows = {
      today: startOfDay(now),
      week: startOfWeek(now),
      month: startOfMonth(now),
    };

    const active = state.receipts.filter((receipt) => receipt.status === "active");
    const totalFor = (since: Date) =>
      active
        .filter((receipt) => within(receipt.issue_date, since))
        .reduce(
          (acc, receipt) => ({
            total: round2(acc.total + receipt.total),
            count: acc.count + 1,
          }),
          { total: 0, count: 0 },
        );

    const recent = [...state.receipts]
      .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
      .slice(0, 6);

    return {
      today: totalFor(windows.today),
      week: totalFor(windows.week),
      month: totalFor(windows.month),
      recent,
    };
  },
};
