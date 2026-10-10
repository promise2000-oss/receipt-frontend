import {
  FilePlus2,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Users,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Short label for the mobile bottom nav */
  shortLabel: string;
  icon: LucideIcon;
  /** Primary CTA (New Receipt) — rendered as a filled brand-red disc */
  cta?: boolean;
  isActive: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/receipts/new",
    label: "New Receipt",
    shortLabel: "New",
    icon: FilePlus2,
    cta: true,
    isActive: (pathname) => pathname === "/receipts/new",
  },
  {
    href: "/receipts",
    label: "Receipts",
    shortLabel: "Receipts",
    icon: ReceiptText,
    isActive: (pathname) => pathname.startsWith("/receipts"),
  },
  {
    href: "/invoices",
    label: "Invoices",
    shortLabel: "Invoices",
    icon: FileText,
    isActive: (pathname) => pathname.startsWith("/invoices"),
  },
  {
    href: "/customers",
    label: "Customers",
    shortLabel: "Customers",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/customers"),
  },
  {
    href: "/team",
    label: "Team",
    shortLabel: "Team",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/team"),
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    isActive: (pathname) => pathname.startsWith("/settings"),
  },
];

/**
 * The bottom nav keeps the New Receipt CTA centred and holds five items —
 * one more would push the touch targets under 44px on a narrow phone, so
 * Customers (the least-used of the five) is the one that stays desktop-only.
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[2],
  NAV_ITEMS[1],
  NAV_ITEMS[4],
  NAV_ITEMS[6],
];
