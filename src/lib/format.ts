const CURRENCY_LOCALES: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
};

/** ₦85,000.00 */
export function formatMoney(value: number, currency = "NGN"): string {
  const locale = CURRENCY_LOCALES[currency] ?? "en-NG";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** 25 Sep 2026 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** 25 Sep 2026, 2:41 PM */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatDate(iso)}, ${date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

/** Monday, 26 September 2026 */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** CO */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** 2 → "2", 2.5 → "2.5" */
export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** 1250000 → "1.25m", 12000 → "12k" (dashboard stat cards) */
export function formatCompactMoney(value: number, currency = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : "";
  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}m`;
  }
  if (value >= 10_000) {
    return `${symbol}${Math.round(value / 1_000)}k`;
  }
  return formatMoney(value, currency);
}
