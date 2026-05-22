import { formatMonth, formatMonthYear } from "@/lib/utils/format";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseMonthKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = value.trim();
  if (!MONTH_KEY_PATTERN.test(normalized)) return null;
  return normalized;
}

/** UTC bounds for a calendar month (YYYY-MM). */
export function getMonthDateRange(monthKey: string): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatReportMonthLabel(monthKey: string): string {
  return formatMonth(monthKey);
}

export function formatReportMonthLong(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return formatMonthYear(month, year);
}

export function buildRecentMonthKeys(count = 24): string[] {
  const keys: string[] = [];
  const now = new Date();

  for (let i = 0; i < count; i += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    keys.push(`${year}-${month}`);
  }

  return keys;
}

export function mergeAvailableMonths(
  fromTransactions: string[],
  includeMonth: string
): string[] {
  const merged = new Set([includeMonth, ...fromTransactions, ...buildRecentMonthKeys(12)]);
  return Array.from(merged).sort((a, b) => b.localeCompare(a));
}
