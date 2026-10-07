import type { ForecastPoint, ForecastTimeframe } from "@/lib/forecasting/types";

const DAY_MS = 86_400_000;

const TIMEFRAMES: Array<{ timeframe: ForecastTimeframe; days: number }> = [
  { timeframe: "7d", days: 7 },
  { timeframe: "30d", days: 30 },
  { timeframe: "90d", days: 90 },
  { timeframe: "180d", days: 180 },
];

/** "YYYY-MM-DD" for a 1-based month/day, matching forecast/recurring date keys. */
export function toDayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getMonthDayKeys(month: number, year: number): string[] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: days }, (_, i) => toDayKey(year, month, i + 1));
}

/**
 * The shortest forecast window that reaches the end of the month, or null when the
 * month is entirely in the past or beyond the longest forecast (180 days).
 */
export function chooseForecastTimeframe(
  monthEndKey: string,
  todayKey: string
): ForecastTimeframe | null {
  const daysAhead = Math.round(
    (Date.parse(`${monthEndKey}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / DAY_MS
  );
  if (daysAhead < 1) return null;
  return TIMEFRAMES.find((option) => option.days >= daysAhead)?.timeframe ?? null;
}

export type DayBalance = { date: string; balance: number };

export type MonthForecastSummary = {
  dailyBalances: DayBalance[];
  /** First projected day this month the balance drops below zero. */
  shortfall: DayBalance | null;
  lowestBalance: DayBalance | null;
};

export function summarizeMonthForecast(
  points: ForecastPoint[],
  monthDayKeys: string[]
): MonthForecastSummary {
  const inMonth = new Set(monthDayKeys);
  const dailyBalances = points
    .filter((point) => point.isProjected && inMonth.has(point.date))
    .map((point) => ({ date: point.date, balance: point.balance }));

  let lowestBalance: DayBalance | null = null;
  for (const day of dailyBalances) {
    if (!lowestBalance || day.balance < lowestBalance.balance) lowestBalance = day;
  }

  return {
    dailyBalances,
    shortfall: dailyBalances.find((day) => day.balance < 0) ?? null,
    lowestBalance,
  };
}
