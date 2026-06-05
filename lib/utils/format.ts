import {
  DEFAULT_CURRENCY,
  getLocaleForCurrency,
  normalizeCurrencyCode,
} from "@/lib/currency/constants";

let displayCurrency = DEFAULT_CURRENCY;

export function setDisplayCurrency(currency: string) {
  displayCurrency = normalizeCurrencyCode(currency);
}

export function getDisplayCurrency() {
  return displayCurrency;
}

export function formatCurrency(amount: number, currency?: string): string {
  const code = normalizeCurrencyCode(currency ?? displayCurrency);
  return new Intl.NumberFormat(getLocaleForCurrency(code), {
    style: "currency",
    currency: code,
    maximumFractionDigits: code === "JPY" ? 0 : 2,
  }).format(amount);
}

export function formatCurrencyAxis(amount: number, currency?: string): string {
  const code = normalizeCurrencyCode(currency ?? displayCurrency);
  const formatted = new Intl.NumberFormat(getLocaleForCurrency(code), {
    style: "currency",
    currency: code,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);

  if (formatted) return formatted;

  const abs = Math.abs(amount);
  const prefix = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(0)}K`;
  return formatCurrency(amount, code);
}

export function formatDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function formatChartDate(date: string): string {
  const value = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const value = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatMonthYear(month: number, year: number): string {
  const value = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Show original amount with optional converted hint in base currency. */
export function formatTransactionAmount(
  amount: number,
  currency: string,
  baseAmount: number,
  preferredCurrency?: string
): string {
  const base = normalizeCurrencyCode(preferredCurrency ?? displayCurrency);
  const txCurrency = normalizeCurrencyCode(currency);
  const primary = formatCurrency(amount, txCurrency);

  if (txCurrency === base || Math.abs(amount - baseAmount) < 0.005) {
    return primary;
  }

  return `${primary} (≈ ${formatCurrency(baseAmount, base)})`;
}
