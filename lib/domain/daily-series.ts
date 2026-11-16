import type { BalanceChartPoint } from "@/lib/types";

const MS_PER_DAY = 86_400_000;

function dayKey(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/**
 * Balance points only exist on days with transactions. Charting them on a category axis
 * squeezes a 4-day gap into one step. Fill every calendar day between the first and last
 * point, carrying the balance forward with zero flow, so the x-axis is real time.
 */
export function densifyDailyBalance(points: BalanceChartPoint[]): BalanceChartPoint[] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((point) => [point.date.slice(0, 10), point]));
  const start = Date.parse(`${sorted[0].date.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${sorted[sorted.length - 1].date.slice(0, 10)}T00:00:00Z`);

  const dense: BalanceChartPoint[] = [];
  let balance = sorted[0].balance;
  for (let time = start; time <= end; time += MS_PER_DAY) {
    const key = dayKey(time);
    const point = byDate.get(key);
    if (point) balance = point.balance;
    dense.push({
      date: key,
      balance,
      income: point?.income ?? 0,
      expenses: point?.expenses ?? 0,
    });
  }
  return dense;
}

export type CumulativeFlowPoint = { date: string; income: number; expenses: number };

/** Running totals of income and expenses through each day. */
export function buildCumulativeFlow(points: BalanceChartPoint[]): CumulativeFlowPoint[] {
  let income = 0;
  let expenses = 0;
  return densifyDailyBalance(points).map((point) => {
    income += point.income ?? 0;
    expenses += point.expenses ?? 0;
    return {
      date: point.date,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
    };
  });
}
