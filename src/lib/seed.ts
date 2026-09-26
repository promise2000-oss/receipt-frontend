import { computeTotals } from "./calc";
import type {
  Business,
  Customer,
  PaymentMethod,
  PaymentStatus,
  Receipt,
  ReceiptItem,
} from "./types";

/**
 * Eleosstyles demo data — shaped to the TRD schema so the mock layer
 * can be swapped for the real REST API without touching the UI.
 */

interface SeedItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface SeedReceipt {
  number: number;
  /** days ago */
  daysAgo: number;
  hour: number;
  customer: number;
  items: SeedItem[];
  discount?: number;
  tax_rate?: number;
  method: PaymentMethod;
  status: PaymentStatus;
  receiptStatus?: "active" | "void";
  void_note?: string;
  notes?: string;
}

const BUSINESS_ID = "b_01eleosstyles";
const CREATED_BY = "u_01_owner";

export const seedBusiness: Business = {
  id: BUSINESS_ID,
  name: "Eleosstyles",
  logo_url: null,
  address: "12 Admiralty Way, Lekki Phase 1, Lagos",
  phone: "+234 803 555 1122",
  email: "hello@eleosstyles.com",
  currency: "NGN",
  brand_primary: "#111111",
  brand_accent: "#B8912F",
  created_at: isoDaysAgo(180, 9),
};

const SEED_CUSTOMERS: Array<Partial<Customer> & { name: string }> = [
  { name: "Chiamaka Obi", phone: "+234 803 555 1122", email: "chiamaka.obi@gmail.com" },
  { name: "Amara Nwosu", phone: "+234 806 214 9087", email: "amara.nwosu@gmail.com" },
  { name: "Tolu Adeyemi", phone: "+234 701 338 4410", email: "tolu.a@outlook.com" },
  { name: "Blessing Eze", phone: "+234 902 771 0043", email: "blessingeze@yahoo.com" },
  { name: "Zainab Yusuf", phone: "+234 813 900 2255", email: "zainab.yusuf@gmail.com" },
  { name: "Kelechi Okonkwo", phone: "+234 805 662 1198", email: "kelechi.ok@gmail.com" },
  { name: "Funmi Balogun", phone: "+234 703 445 8820", email: "funmi.balogun@gmail.com" },
  { name: "Ifeoma Chukwu", phone: "+234 815 220 6677", email: "ifeoma.chukwu@gmail.com" },
];

const SEED_RECEIPTS: SeedReceipt[] = [
  {
    number: 214,
    daysAgo: 0,
    hour: 10,
    customer: 0,
    items: [
      { description: "Custom Ankara Gown", quantity: 1, unit_price: 85000 },
      { description: "Fabric Sourcing", quantity: 1, unit_price: 10000 },
    ],
    discount: 5000,
    method: "transfer",
    status: "paid",
  },
  {
    number: 213,
    daysAgo: 0,
    hour: 13,
    customer: 3,
    items: [{ description: "Gele Tying (Service)", quantity: 2, unit_price: 5000 }],
    method: "cash",
    status: "paid",
  },
  {
    number: 212,
    daysAgo: 0,
    hour: 16,
    customer: 5,
    items: [
      { description: "Agbada Set — Menswear", quantity: 1, unit_price: 120000 },
      { description: "Hemming & Alterations", quantity: 1, unit_price: 8000 },
    ],
    method: "card",
    status: "partial",
    notes: "Balance of ₦64,000 due before delivery.",
  },
  {
    number: 211,
    daysAgo: 1,
    hour: 11,
    customer: 1,
    items: [
      { description: "Aso Ebi Fabric (5 yards)", quantity: 3, unit_price: 18500 },
      { description: "Beading & Embellishment", quantity: 1, unit_price: 25000 },
    ],
    discount: 10000,
    tax_rate: 0,
    method: "transfer",
    status: "paid",
  },
  {
    number: 210,
    daysAgo: 2,
    hour: 15,
    customer: 2,
    items: [{ description: "Two-Piece Wrapper Set", quantity: 1, unit_price: 65000 }],
    method: "transfer",
    status: "pending",
    notes: "Payment expected on pickup.",
  },
  {
    number: 209,
    daysAgo: 3,
    hour: 9,
    customer: 4,
    items: [
      { description: "Silk Maxi Dress", quantity: 1, unit_price: 95000 },
      { description: "Express Delivery (Lekki → Ikoyi)", quantity: 1, unit_price: 5000 },
    ],
    method: "other",
    status: "paid",
  },
  {
    number: 208,
    daysAgo: 5,
    hour: 14,
    customer: 6,
    items: [{ description: "Blouse & Skirt Combo", quantity: 2, unit_price: 42500 }],
    tax_rate: 7.5,
    method: "cash",
    status: "paid",
  },
  {
    number: 207,
    daysAgo: 8,
    hour: 12,
    customer: 7,
    items: [{ description: "Bridal Fitting (3 sessions)", quantity: 3, unit_price: 20000 }],
    method: "transfer",
    status: "paid",
  },
  {
    number: 206,
    daysAgo: 11,
    hour: 17,
    customer: 0,
    items: [{ description: "Ankara Mini Dress", quantity: 1, unit_price: 48000 }],
    method: "cash",
    status: "paid",
    receiptStatus: "void",
    void_note: "Customer changed her mind before pickup — refunded deposit.",
  },
  {
    number: 205,
    daysAgo: 14,
    hour: 10,
    customer: 1,
    items: [
      { description: "Corset Evening Gown", quantity: 1, unit_price: 150000 },
      { description: "Fitting Session", quantity: 2, unit_price: 7500 },
    ],
    discount: 15000,
    method: "card",
    status: "paid",
  },
  {
    number: 204,
    daysAgo: 19,
    hour: 13,
    customer: 5,
    items: [{ description: "Traditional Wire Neck Set", quantity: 1, unit_price: 32000 }],
    method: "transfer",
    status: "pending",
  },
  {
    number: 203,
    daysAgo: 27,
    hour: 11,
    customer: 3,
    items: [
      { description: "Aso Ebi Gown (Made to measure)", quantity: 1, unit_price: 78000 },
      { description: "Veil & Headpiece", quantity: 1, unit_price: 22000 },
    ],
    tax_rate: 7.5,
    method: "transfer",
    status: "paid",
  },
];

function isoDaysAgo(days: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, (days * 17) % 60, 0, 0);
  return date.toISOString();
}

export interface SeedState {
  business: Business;
  customers: Customer[];
  receipts: Receipt[];
}

export function createSeedState(): SeedState {
  const customers: Customer[] = SEED_CUSTOMERS.map((customer, index) => ({
    id: `c_${String(index + 1).padStart(2, "0")}`,
    business_id: BUSINESS_ID,
    name: customer.name,
    phone: customer.phone ?? null,
    email: customer.email ?? null,
    created_at: isoDaysAgo(120 - index * 8, 10),
  }));

  const receipts = SEED_RECEIPTS.map((spec) => {
    const customer = customers[spec.customer];
    const issueDate = isoDaysAgo(spec.daysAgo, spec.hour);
    const receiptId = `ES-${String(spec.number).padStart(6, "0")}`;
    const totals = computeTotals(spec.items, spec.discount ?? 0, spec.tax_rate ?? 0);
    const isVoid = spec.receiptStatus === "void";

    const items: ReceiptItem[] = spec.items.map((item, index) => ({
      id: `${receiptId}-i${index + 1}`,
      receipt_id: receiptId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: Math.round(item.quantity * item.unit_price * 100) / 100,
    }));

    return {
      id: receiptId,
      business_id: BUSINESS_ID,
      customer_id: customer.id,
      receipt_number: receiptId,
      issue_date: issueDate,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      payment_method: spec.method,
      payment_status: isVoid ? "pending" : spec.status,
      status: spec.receiptStatus ?? "active",
      void_note: spec.void_note ?? null,
      voided_at: isVoid ? issueDate : null,
      notes: spec.notes ?? null,
      created_by: CREATED_BY,
      created_at: issueDate,
    } satisfies Receipt;
  });

  return { business: seedBusiness, customers, receipts };
}
