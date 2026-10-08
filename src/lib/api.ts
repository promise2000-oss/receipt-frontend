import { computeTotals, round2 } from "./calc";
import { createSeedState } from "./seed";
import * as auth from "./auth";
import type {
  Business,
  Customer,
  DashboardSummary,
  Receipt,
  ReceiptFilters,
  ReceiptInput,
  SessionInfo,
  SignInInput,
  SignUpInput,
  Workspace,
} from "./types";

/**
 * API-shaped mock client — mirrors the TRD §3.1 endpoints so the UI can
 * later swap this module for real REST calls without component changes.
 *
 *   POST   /auth/register    -> signUp()
 *   POST   /auth/login       -> signIn()
 *   POST   /auth/logout      -> signOut()
 *   GET    /auth/session     -> getSession()
 *   GET    /business/me        -> getBusiness()
 *   PATCH  /business/me        -> updateBusiness()
 *   GET    /customers          -> getCustomers()
 *   POST   /customers          -> createCustomer()
 *   GET    /receipts           -> getReceipts()
 *   GET    /receipts/:id       -> getReceipt()
 *   POST   /receipts           -> createReceipt()
 *   PATCH  /receipts/:id/void  -> voidReceipt()
 *   GET    /dashboard/summary  -> getDashboardSummary()
 *
 * Data is partitioned per organization: each account owns a workspace stored
 * under its own localStorage key, so one signed-in org never sees another
 * org's customers or receipts.
 */

/** Workspace written by builds before org accounts existed. */
const LEGACY_KEY = "eleosstyles.receipt-system.v1";
const LATENCY_MS = 260;

const workspaceKey = (accountId: string) =>
  `eleosstyles.workspace.${accountId}`;

const hasWindow = () => typeof window !== "undefined";

/** Cached workspace for the *current* session only. */
let memoryState: Workspace | null = null;
let memoryAccountId: string | null = null;

/* ------------------------------- Storage ------------------------------- */

function persist(state: Workspace): void {
  memoryState = state;
  const accountId = auth.getSession()?.account_id;
  if (!hasWindow() || !accountId) return;
  try {
    window.localStorage.setItem(workspaceKey(accountId), JSON.stringify(state));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

function readRaw(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function removeRaw(key: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Fresh, unbranded workspace for a brand-new organization. */
function emptyWorkspace(session: SessionInfo): Workspace {
  return {
    business: {
      id: `b_${crypto.randomUUID().slice(0, 8)}`,
      name: session.org_name,
      logo_url: null,
      address: "",
      phone: "",
      email: session.email,
      currency: "NGN",
      brand_primary: "#111111",
      brand_accent: "#B8912F",
      created_at: new Date().toISOString(),
    },
    customers: [],
    receipts: [],
  };
}

/**
 * The signed-in org's workspace. On a miss it claims whatever was already on
 * this browser (pre-account data, or the demo seed on a fresh install) and
 * re-badges it with the new organization's name.
 */
function loadState(): Workspace {
  const accountId = auth.getSession()?.account_id;

  // Signed out: hand back an empty shell — the shell gate redirects away.
  if (!accountId) {
    if (!memoryState) memoryState = emptyWorkspace(placeholderSession());
    return memoryState;
  }

  if (memoryState && memoryAccountId === accountId) return memoryState;

  const stored = readRaw(workspaceKey(accountId));
  if (stored) {
    try {
      memoryState = JSON.parse(stored) as Workspace;
      memoryAccountId = accountId;
      return memoryState;
    } catch {
      /* fall through and re-provision */
    }
  }

  const session = auth.getSession()!;
  const legacy = readRaw(LEGACY_KEY);
  let state: Workspace;

  if (legacy) {
    try {
      state = JSON.parse(legacy) as Workspace;
      state.business = { ...state.business, name: session.org_name };
      removeRaw(LEGACY_KEY);
    } catch {
      state = emptyWorkspace(session);
    }
  } else {
    state = emptyWorkspace(session);
  }

  persist(state);
  memoryAccountId = accountId;
  return state;
}

function placeholderSession(): SessionInfo {
  return {
    account_id: "",
    org_name: "",
    owner_name: "",
    email: "",
  };
}

/** Forget the cached workspace — called whenever the session changes. */
function resetState(): void {
  memoryState = null;
  memoryAccountId = null;
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
  /* ------------------------------ Accounts ------------------------------ */

  /**
   * Register an organization. The first account created on this browser
   * adopts the workspace already present here (your data, or the demo seed
   * on a fresh install); every later account starts with a clean workspace.
   */
  async signUp(input: SignUpInput): Promise<SessionInfo> {
    const isFirstAccount = !auth.hasAnyAccount();
    const session = await auth.signUp(input);
    resetState();

    if (isFirstAccount) {
      // Adopt whatever is on this browser under the new account's key.
      const legacy = readRaw(LEGACY_KEY);
      if (legacy) {
        writeRaw(workspaceKey(session.account_id), legacy);
        removeRaw(LEGACY_KEY);
      } else if (!readRaw(workspaceKey(session.account_id))) {
        writeRaw(
          workspaceKey(session.account_id),
          JSON.stringify(createSeedState()),
        );
      }
    }

    const state = loadState();
    // Claimed data keeps its receipts but is re-badged with the new org name.
    if (state.business.name !== session.org_name) {
      persist({ ...state, business: { ...state.business, name: session.org_name } });
    }

    return session;
  },

  async signIn(input: SignInInput): Promise<SessionInfo> {
    const session = await auth.signIn(input);
    resetState();
    loadState();
    return session;
  },

  signOut(): void {
    auth.signOut();
    resetState();
  },

  getSession(): SessionInfo | null {
    return auth.getSession();
  },

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
    const accountId = auth.getSession()?.account_id ?? "";

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
      created_by: accountId,
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
