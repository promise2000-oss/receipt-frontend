import {
  FilePlus2,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Short label for the mobile bottom nav */
  shortLabel: string;
  icon: LucideIcon;
  /** Gold primary CTA (New Receipt) */
  cta?: boolean;
  isActive: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/",
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
    href: "/customers",
    label: "Customers",
    shortLabel: "Customers",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/customers"),
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    isActive: (pathname) => pathname.startsWith("/settings"),
  },
];

/** Bottom nav keeps the New Receipt CTA centred. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[2],
  NAV_ITEMS[1],
  NAV_ITEMS[3],
  NAV_ITEMS[4],
];
