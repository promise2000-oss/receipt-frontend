/**
 * Domain types — mirrors the Receipt System TRD §2 schema.
 */

export type PaymentMethod = "cash" | "transfer" | "card" | "other";
export type PaymentStatus = "paid" | "partial" | "pending";
export type ReceiptStatus = "active" | "void";

/** What produced a receipt: a point-of-sale sale, or an invoice payment. */
export type ReceiptSource = "standalone" | "invoice_payment";

/**
 * Invoice lifecycle.
 *
 * `overdue` is derived by the API from "issued, unpaid, past the due date" —
 * the UI never computes it, it only displays what the server says.
 */
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  transfer: "Bank Transfer",
  card: "Card",
  other: "Other",
};

/* --------------------------------- Team -------------------------------- */

/**
 * Membership role.
 *
 * Mirrors the enum in the database and the matrix in `@eleos/shared`. The
 * server is the authority on what each role may do — these labels and the
 * ordering exist so the UI can *hide* a control the API would refuse, never to
 * grant one it would not.
 */
export type Role = "owner" | "admin" | "staff" | "viewer";

export const ROLES: Role[] = ["owner", "admin", "staff", "viewer"];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control, including ownership transfer and deleting the organization.",
  admin: "Runs day-to-day operations: team, receipts, invoices, customers and settings.",
  staff: "Issues receipts and records payments. Cannot change organization settings.",
  viewer: "Read-only. Cannot create, edit, delete or record anything.",
};

/** Higher rank outranks lower. Mirrors `canAssignRole` on the server. */
const ROLE_RANK: Record<Role, number> = { viewer: 0, staff: 1, admin: 2, owner: 3 };

export function outranks(actor: Role, target: Role): boolean {
  return ROLE_RANK[actor] > ROLE_RANK[target];
}

/** Whether this actor may assign `target` to somebody. */
export function canAssignRole(actor: Role, target: Role): boolean {
  return outranks(actor, target);
}

/**
 * The permissions this role holds, mirroring `@eleos/shared#can`.
 *
 * Present so the UI can hide a control the API would refuse. It is a
 * convenience layer, not a security boundary: every one of these is enforced
 * server-side, and a client that disagreed would only ever see a 403.
 *
 * Kept deliberately small and matching the server's grant lists exactly — a
 * permission invented here would render a button that always fails.
 */
export type Permission =
  | "org.update"
  | "org.delete"
  | "team.invite"
  | "team.updateRole"
  | "team.revoke"
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "receipt.create"
  | "receipt.void"
  | "invoice.create"
  | "invoice.update"
  | "invoice.issue"
  | "invoice.cancel"
  | "invoice.recordPayment";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: [
    "org.update", "org.delete",
    "team.invite", "team.updateRole", "team.revoke",
    "customer.create", "customer.update", "customer.delete",
    "receipt.create", "receipt.void",
    "invoice.create", "invoice.update", "invoice.issue", "invoice.cancel",
    "invoice.recordPayment",
  ],
  admin: [
    "org.update",
    "team.invite", "team.updateRole", "team.revoke",
    "customer.create", "customer.update", "customer.delete",
    "receipt.create", "receipt.void",
    "invoice.create", "invoice.update", "invoice.issue", "invoice.cancel",
    "invoice.recordPayment",
  ],
  // Matches the server: staff do the day-to-day work, including issuing
  // receipts and recording payments, but administer nothing and cancel
  // nothing.
  staff: [
    "customer.create", "customer.update",
    "receipt.create", "receipt.void",
    "invoice.create", "invoice.recordPayment",
  ],
  viewer: [],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export interface Member {
  id: string;
  business_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  expires_at: string;
  created_at: string;
  /**
   * The plaintext token, returned exactly once at creation. The server keeps
   * only a hash, so this cannot be shown again — a caller that loses it must
   * re-invite.
   */
  token?: string;
  /** A ready-made link an owner can copy and send. */
  accept_url?: string;
}

export interface TeamSummary {
  members: Member[];
  invitations: Invitation[];
  /** The roles this actor may grant, computed server-side. */
  assignable_roles: Role[];
}

/* --------------------------------- Audit -------------------------------- */

export interface AuditEntry {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: { id: string; full_name: string; email: string } | null;
}

export interface AuditLog {
  items: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  /** The action vocabulary present in this organization's log. */
  actions: string[];
}

/* ------------------------------ Accounts ------------------------------ */

/** What the app needs about the signed-in account. Never carries the password. */
export interface SessionInfo {
  account_id: string;
  org_name: string;
  owner_name: string;
  email: string;
  role: Role;
  /**
   * The signed-in organization in full.
   *
   * `/auth/me` already returns it, so hanging it off the session means every
   * identity surface — header, sidebar, dashboard, document titles — resolves
   * from the one request the session provider was making anyway. Nothing has
   * to fetch branding separately, and nothing can render a stale name after a
   * rename.
   */
  business: Business;
}

export interface SignUpInput {
  org_name: string;
  owner_name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

/**
 * The organization. This *is* the tenant: receipts, customers, users and
 * branding all hang off `id`, and the session decides which one you are.
 */
export interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  currency: string;
  brand_primary: string;
  brand_accent: string;
  /** Document watermarking. The API is the authority on every one of these. */
  watermark_enabled: boolean;
  watermark_text: string;
  watermark_opacity: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Receipt {
  id: string;
  business_id: string;
  customer_id: string | null;
  receipt_number: string;
  issue_date: string;
  /** Snapshot of the customer at issue time — receipts are immutable. */
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  /** A point-of-sale sale, or generated from a payment on an invoice. */
  source: ReceiptSource;
  /** Present only when `source` is `invoice_payment`. */
  invoice_payment_id: string | null;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  /**
   * Rate captured when the receipt was issued.
   *
   * Receipts are immutable, so a legacy document issued under a tax regime
   * still has to reconcile on the printed page: subtotal → tax → total. New
   * receipts are always issued at zero, and the form offers no tax control,
   * so this is display-only — see {@link Receipt.tax}.
   */
  tax_rate: number;
  /** Non-zero only on receipts issued before tax was dropped from the form. */
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: ReceiptStatus;
  void_note: string | null;
  voided_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

/** Payload accepted by POST /receipts */
export interface ReceiptInput {
  customer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  discount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
}

export type ReceiptChip = "all" | "paid" | "partial" | "pending" | "void";

export interface ReceiptFilters {
  q?: string;
  chip?: ReceiptChip;
  period?: "all" | "today" | "week" | "month";
}

/* -------------------------------- Invoicing ---------------------------- */

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  paid_at: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  /** The receipt generated from this payment, when one was requested. */
  receipt_id: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  tax_rate: number;
  total: number;
  amount_paid: number;
  /** Computed server-side from `total − amount_paid`. Never client arithmetic. */
  balance_due: number;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  po_reference: string | null;
  pdf_url: string | null;
  issued_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  payments: InvoicePayment[];
  created_at: string;
}

export interface InvoiceInput {
  customer: { id?: string; name: string; phone?: string; email?: string };
  items: Array<{ description: string; quantity: number; unit_price: number }>;
  discount: number;
  tax_rate: number;
  notes?: string;
  terms?: string;
  po_reference?: string;
  due_date?: string | null;
  issue: boolean;
}

export type InvoiceChip =
  | "all"
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface InvoiceFilters {
  q?: string;
  chip?: InvoiceChip;
}

export interface InvoiceTotals {
  invoiced: number;
  received: number;
  outstanding: number;
  overdue: number;
  count: number;
}

export interface InvoiceSummary {
  currency: string;
  totals: InvoiceTotals;
  recent: Invoice[];
}

export interface DashboardSummary {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  recent: Receipt[];
}
