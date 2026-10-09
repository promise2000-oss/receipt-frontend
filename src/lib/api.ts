import type {
  Business,
  Customer,
  DashboardSummary,
  PaymentMethod,
  PaymentStatus,
  Receipt,
  ReceiptChip,
  ReceiptFilters,
  ReceiptInput,
  ReceiptStatus,
  SessionInfo,
  SignInInput,
  SignUpInput,
} from "./types";

/**
 * Client for the receipt API (the platform is operated by VisionaryGene).
 *
 * All calls go to `/api/*` on *this* origin; `next.config.ts` rewrites them to
 * `API_URL` from `.env`. The proxy is what makes auth possible — the API
 * issues a `SameSite=Lax` session cookie, which browsers never send on a
 * cross-site fetch, so the request has to be same-origin to carry it.
 *
 *   POST   /auth/signup              -> signUp()
 *   POST   /auth/login               -> signIn()
 *   POST   /auth/logout              -> signOut()
 *   GET    /auth/me                  -> getSession()
 *   GET    /business                 -> getBusiness()
 *   PATCH  /business                 -> updateBusiness()
 *   POST   /business/logo            -> uploadLogo()
 *   DELETE /business/logo            -> removeLogo()
 *   GET    /customers                -> getCustomers()
 *   POST   /customers                -> createCustomer()
 *   GET    /receipts                 -> getReceipts()
 *   GET    /receipts/:id             -> getReceipt()
 *   POST   /receipts                 -> createReceipt()
 *   POST   /receipts/:id/void        -> voidReceipt()
 *   GET    /receipts/:id/share       -> getShareLinks()
 *   GET    /dashboard/summary        -> getDashboardSummary()
 *
 * Responses arrive in the API's own shape (a `customer` object, a
 * `void_reason`, paginated `{items, total}` lists…); the `to*` mappers below
 * translate them into the UI's types so components stay untouched.
 */

const API_BASE = "/api";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Requests carry a page of 100 at most (the API caps `limit` at 100). */
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/* -------------------------------- Errors -------------------------------- */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: Record<string, string> | undefined;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/* ------------------------------ Wire types ------------------------------ */

interface ApiBusiness {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  currency: string;
  brand_primary: string;
  brand_accent: string;
  number_prefix: string;
  created_at: string;
  updated_at: string;
}

interface ApiCustomer {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface ApiReceiptItem {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ApiReceipt {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  receipt_number: string;
  issue_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  tax_rate: number;
  total: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: ReceiptStatus;
  notes: string | null;
  pdf_url: string | null;
  voided_at: string | null;
  void_reason: string | null;
  original_receipt_id: string | null;
  created_by: string;
  created_at: string;
  items: ApiReceiptItem[];
}

interface ApiAuth {
  user: {
    id: string;
    business_id: string;
    full_name: string;
    email: string;
    role: "owner" | "staff";
  };
  business: ApiBusiness;
}

interface ApiList<T> {
  items: T[];
  total: number;
}

interface ApiTotals {
  count: number;
  total: number;
}

interface ApiDashboard {
  currency: string;
  today: ApiTotals;
  week: ApiTotals;
  month: ApiTotals;
  outstanding: ApiTotals;
  recent: ApiReceipt[];
}

interface ApiShare {
  token: string;
  /** Expiring link to the full public receipt page. */
  url: string;
  /**
   * Non-expiring verification page — what the receipt's QR code encodes.
   * Absent on API builds that predate it, hence optional.
   */
  verify_url?: string;
  expires_at: string;
}

/* -------------------------------- Transport ------------------------------ */

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  // FormData must keep its own multipart boundary header.
  if (init.body != null && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      "Can't reach the receipt service. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const problem = (payload ?? {}) as {
      message?: string;
      code?: string;
      details?: Record<string, string>;
    };
    throw new ApiError(
      problem.message ?? `The receipt service returned an error (${response.status}).`,
      response.status,
      problem.code,
      problem.details,
    );
  }

  return payload as T;
}

const jsonBody = (value: unknown): string => JSON.stringify(value);

/* -------------------------------- Mappers -------------------------------- */

function toBusiness(value: ApiBusiness): Business {
  return {
    id: value.id,
    name: value.name,
    logo_url: value.logo_url,
    address: value.address ?? "",
    phone: value.phone ?? "",
    email: value.email ?? "",
    website: value.website ?? null,
    currency: value.currency,
    brand_primary: value.brand_primary,
    brand_accent: value.brand_accent,
    created_at: value.created_at,
    updated_at: value.updated_at ?? value.created_at,
  };
}

function toCustomer(value: ApiCustomer): Customer {
  return {
    id: value.id,
    business_id: value.business_id,
    name: value.name,
    phone: value.phone ?? null,
    email: value.email ?? null,
    created_at: value.created_at,
  };
}

function toReceipt(value: ApiReceipt): Receipt {
  return {
    id: value.id,
    business_id: value.business_id,
    customer_id: value.customer_id,
    receipt_number: value.receipt_number,
    issue_date: value.issue_date,
    customer_name: value.customer?.name ?? "Walk-in customer",
    customer_phone: value.customer?.phone ?? null,
    customer_email: value.customer?.email ?? null,
    items: (value.items ?? []).map((item) => ({
      id: item.id,
      receipt_id: value.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    })),
    subtotal: value.subtotal,
    discount: value.discount,
    tax: value.tax ?? 0,
    tax_rate: value.tax_rate ?? 0,
    total: value.total,
    payment_method: value.payment_method,
    payment_status: value.payment_status,
    status: value.status,
    void_note: value.void_reason ?? null,
    voided_at: value.voided_at ?? null,
    notes: value.notes ?? null,
    created_by: value.created_by,
    created_at: value.created_at,
  };
}

function toSession(value: ApiAuth): SessionInfo {
  return {
    account_id: value.user.id,
    org_name: value.business.name,
    owner_name: value.user.full_name,
    email: value.user.email,
    role: value.user.role,
    business: toBusiness(value.business),
  };
}

/* --------------------------------- Dates --------------------------------- */

/** Local `YYYY-MM-DD` — what the API's `from`/`to` filters expect. */
function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOf(period: "today" | "week" | "month"): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (period === "today") return now;
  if (period === "month") {
    now.setDate(1);
    return now;
  }
  const daysSinceMonday = (now.getDay() + 6) % 7; // week starts Monday
  now.setDate(now.getDate() - daysSinceMonday);
  return now;
}

/* ------------------------------ Receipt ids ------------------------------ */

/**
 * Routes address receipts as `ES-000001` but the API only resolves UUIDs, so
 * human-facing references go through a search first.
 */
async function resolveReceiptId(idOrNumber: string): Promise<string | null> {
  if (UUID_RE.test(idOrNumber)) return idOrNumber;

  const list = await request<ApiList<ApiReceipt>>(
    `/receipts?search=${encodeURIComponent(idOrNumber)}&limit=${PAGE_SIZE}`,
  );
  const exact = list.items.find((item) => item.receipt_number === idOrNumber);
  if (exact) return exact.id;
  return list.items.length === 1 ? list.items[0].id : null;
}

/* ------------------------------- Collections ----------------------------- */

const normalise = (value: string | undefined | null) =>
  (value ?? "").replace(/\s+/g, "").toLowerCase();

/** Fields `PATCH /business` accepts — `logo_url` is set by its own endpoint. */
const BUSINESS_FIELDS = [
  "name",
  "address",
  "phone",
  "email",
  "website",
  "currency",
  "brand_primary",
  "brand_accent",
] as const;

export const api = {
  /* ------------------------------ Accounts ------------------------------ */

  async signUp(input: SignUpInput): Promise<SessionInfo> {
    const auth = await request<ApiAuth>("/auth/signup", {
      method: "POST",
      body: jsonBody({
        business: { name: input.org_name.trim() },
        user: {
          full_name: input.owner_name.trim(),
          email: input.email.trim().toLowerCase(),
          password: input.password,
        },
      }),
    });
    return toSession(auth);
  },

  async signIn(input: SignInInput): Promise<SessionInfo> {
    const auth = await request<ApiAuth>("/auth/login", {
      method: "POST",
      body: jsonBody({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });
    return toSession(auth);
  },

  /** Clears the session cookie. Best-effort: the UI signs out either way. */
  async signOut(): Promise<void> {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* already signed out, or the service is unreachable */
    }
  },

  /** The signed-in organization, or null when the session cookie is absent. */
  async getSession(): Promise<SessionInfo | null> {
    try {
      return toSession(await request<ApiAuth>("/auth/me"));
    } catch (error) {
      // Only an explicit rejection means "nobody is signed in". An offline
      // browser, a rate limiter, or an API mid-restart says nothing about
      // whether the cookie is valid, so let those surface instead of reading
      // them as a logout.
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return null;
      }
      throw error;
    }
  },

  /* ------------------------------- Business ------------------------------ */

  async getBusiness(): Promise<Business> {
    return toBusiness(await request<ApiBusiness>("/business"));
  },

  async updateBusiness(patch: Partial<Business>): Promise<Business> {
    const body: Record<string, string> = {};
    for (const field of BUSINESS_FIELDS) {
      const value = patch[field];
      if (typeof value === "string") body[field] = value;
    }
    if (Object.keys(body).length === 0) return api.getBusiness();
    return toBusiness(
      await request<ApiBusiness>("/business", {
        method: "PATCH",
        body: jsonBody(body),
      }),
    );
  },

  /** Multipart upload — max 3 MB, PNG/JPEG/WebP/SVG/GIF. */
  async uploadLogo(file: File): Promise<Business> {
    const form = new FormData();
    form.append("logo", file, file.name);
    return toBusiness(
      await request<ApiBusiness>("/business/logo", { method: "POST", body: form }),
    );
  },

  async removeLogo(): Promise<Business> {
    return toBusiness(
      await request<ApiBusiness>("/business/logo", { method: "DELETE" }),
    );
  },

  /* ------------------------------- Customers ----------------------------- */

  async getCustomers(): Promise<Customer[]> {
    const list = await request<ApiList<ApiCustomer>>("/customers");
    return list.items
      .map(toCustomer)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async createCustomer(
    input: Pick<Customer, "name"> & Partial<Pick<Customer, "phone" | "email">>,
  ): Promise<Customer> {
    return toCustomer(
      await request<ApiCustomer>("/customers", {
        method: "POST",
        body: jsonBody({
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
        }),
      }),
    );
  },

  /* -------------------------------- Receipts ------------------------------ */

  async getReceipts(filters: ReceiptFilters = {}): Promise<Receipt[]> {
    const params = new URLSearchParams();
    const query = filters.q?.trim();
    if (query) params.set("search", query);

    const chip: ReceiptChip = filters.chip ?? "all";
    if (chip === "void") {
      params.set("status", "void");
    } else if (chip !== "all") {
      params.set("status", "active");
      params.set("payment_status", chip);
    }

    if (filters.period && filters.period !== "all") {
      params.set("from", isoDate(startOf(filters.period)));
    }

    params.set("limit", String(PAGE_SIZE));

    const receipts: Receipt[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      params.set("page", String(page));
      const batch = await request<ApiList<ApiReceipt>>(`/receipts?${params}`);
      receipts.push(...batch.items.map(toReceipt));
      if (batch.items.length < PAGE_SIZE) break;
    }

    return receipts.sort((a, b) => b.issue_date.localeCompare(a.issue_date));
  },

  /** Accepts either the receipt's UUID or its `ES-000001` number. */
  async getReceipt(idOrNumber: string): Promise<Receipt | null> {
    const id = await resolveReceiptId(idOrNumber);
    if (!id) return null;
    try {
      return toReceipt(await request<ApiReceipt>(`/receipts/${id}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async createReceipt(input: ReceiptInput): Promise<Receipt> {
    let customerId = input.customer.id ?? null;

    // Reuse an existing customer when the details match, otherwise save them.
    if (!customerId) {
      const name = input.customer.name.trim();
      const phone = input.customer.phone?.trim() || null;
      const customers = await api.getCustomers();
      const match = customers.find(
        (customer) =>
          (phone &&
            customer.phone &&
            normalise(customer.phone) === normalise(phone)) ||
          normalise(customer.name) === normalise(name),
      );
      customerId = match
        ? match.id
        : (
            await api.createCustomer({
              name,
              phone: phone ?? undefined,
              email: input.customer.email,
            })
          ).id;
    }

    const created = await request<ApiReceipt>("/receipts", {
      method: "POST",
      body: jsonBody({
        customer_id: customerId,
        items: input.items.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount: input.discount,
        payment_method: input.payment_method,
        payment_status: input.payment_status,
        notes: input.notes?.trim() || null,
      }),
    });

    return toReceipt(created);
  },

  /** Returns null when the receipt is missing or already voided. */
  async voidReceipt(idOrNumber: string, reason: string): Promise<Receipt | null> {
    const id = await resolveReceiptId(idOrNumber);
    if (!id) return null;
    try {
      return toReceipt(
        await request<ApiReceipt>(`/receipts/${id}/void`, {
          method: "POST",
          body: jsonBody({ reason }),
        }),
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 409)
      ) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Public links for a receipt.
   *
   * Returns both flavours because they exist for different lifetimes: `url`
   * is the expiring link you send to a customer, while `verify_url` is the
   * non-expiring verification page the QR code has to keep resolving to long
   * after the share link would have lapsed.
   */
  async getShareLinks(
    idOrNumber: string,
  ): Promise<{ url: string; verify_url: string }> {
    const id = await resolveReceiptId(idOrNumber);
    if (!id) throw new ApiError("Receipt not found.", 404, "NOT_FOUND");
    const share = await request<ApiShare>(`/receipts/${id}/share`);
    // Older API builds predate `verify_url`; fall back to the share link so
    // the QR still resolves somewhere rather than disappearing.
    const verify = share.verify_url || share.url;
    return { url: share.url, verify_url: verify };
  },

  /* -------------------------------- Dashboard ----------------------------- */

  async getDashboardSummary(): Promise<DashboardSummary> {
    const summary = await request<ApiDashboard>("/dashboard/summary");
    return {
      today: summary.today,
      week: summary.week,
      month: summary.month,
      recent: (summary.recent ?? []).map(toReceipt),
    };
  },
};
