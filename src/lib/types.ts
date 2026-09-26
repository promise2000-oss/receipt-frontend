/**
 * Domain types — mirrors the Receipt System TRD §2 schema.
 */

export type PaymentMethod = "cash" | "transfer" | "card" | "other";
export type PaymentStatus = "paid" | "partial" | "pending";
export type ReceiptStatus = "active" | "void";

export interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  address: string;
  phone: string;
  email: string;
  currency: string;
  brand_primary: string;
  brand_accent: string;
  created_at: string;
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
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
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
  tax_rate: number;
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

export interface DashboardSummary {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  recent: Receipt[];
}
