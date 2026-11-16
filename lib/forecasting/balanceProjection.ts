import { TransactionType } from "@prisma/client";
import type {
  ForecastPoint,
  RecurringForecastEvent,
  SpendingTrendMetrics,
} from "@/lib/forecasting/types";
import { addUtcDays, roundMoney, toDateKey } from "@/lib/forecasting/types";
import { startOfUtcDay } from "@/lib/domain/recurrence-dates";

type ProjectBalanceInput = {
  currentBalance: number;
  forecastDays: number;
  historicalPoints: ForecastPoint[];
  recurringEvents: RecurringForecastEvent[];
  trends: SpendingTrendMetrics;
  asOf?: Date;
};

/** z-score for a two-sided ~80% interval. */
const RANGE_Z = 1.28;

function groupEventsByDate(events: RecurringForecastEvent[]): Map<string, RecurringForecastEvent[]> {
  const grouped = new Map<string, RecurringForecastEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.date) ?? [];
    existing.push(event);
    grouped.set(event.date, existing);
  }

  return grouped;
}

/**
 * Historical points are a running sum of transactions, which ignores opening balances
 * and transfers. Shift the whole line so it ends exactly at the real current balance;
 * the shape (the day-to-day changes) is preserved.
 */
function anchorHistory(historical: ForecastPoint[], currentBalance: number): ForecastPoint[] {
  const last = historical[historical.length - 1];
  if (!last) return [];
  const offset = currentBalance - last.balance;
  if (Math.abs(offset) < 0.005) return historical;
  return historical.map((point) => ({ ...point, balance: roundMoney(point.balance + offset) }));
}

export function projectBalance(input: ProjectBalanceInput): ForecastPoint[] {
  const today = startOfUtcDay(input.asOf ?? new Date());
  const eventsByDate = groupEventsByDate(input.recurringEvents);
  // Recurring items come from their schedule; everything else from the non-recurring trend.
  // (Previously recurring spend was partly counted twice and non-recurring income ignored.)
  const variableExpense = input.trends.variableDailyExpense;
  const variableIncome = input.trends.variableDailyIncome;
  const dailyStdDev = input.trends.variableDailyStdDev;

  const historical = anchorHistory(
    input.historicalPoints.filter((point) => !point.isProjected),
    input.currentBalance
  );
  const points: ForecastPoint[] = [...historical];

  if (points.length === 0) {
    points.push({
      date: toDateKey(today),
      balance: roundMoney(input.currentBalance),
      isProjected: false,
    });
  }

  // Always project from the real balance, not from the transaction running sum.
  let balance = input.currentBalance;

  for (let day = 1; day <= input.forecastDays; day += 1) {
    const dateKey = toDateKey(addUtcDays(today, day));
    const dayEvents = eventsByDate.get(dateKey) ?? [];

    let income = variableIncome;
    let expenses = variableExpense;

    for (const event of dayEvents) {
      if (event.type === TransactionType.INCOME) {
        income += event.amount;
      } else {
        expenses += event.amount;
      }
    }

    balance += income - expenses;
    // Daily noise accumulates like a random walk: spread grows with √days.
    const spread = RANGE_Z * dailyStdDev * Math.sqrt(day);
    const rounded = roundMoney(balance);

    points.push({
      date: dateKey,
      balance: rounded,
      isProjected: true,
      income: roundMoney(income),
      expenses: roundMoney(expenses),
      lower: roundMoney(rounded - spread),
      upper: roundMoney(rounded + spread),
    });
  }

  return points;
}

export function buildHistoricalBalancePoints(
  transactions: Array<{
    date: Date;
    amount: number;
    type: TransactionType;
  }>,
  historyDays: number,
  asOf: Date = new Date()
): ForecastPoint[] {
  const today = startOfUtcDay(asOf);
  const todayEnd = addUtcDays(today, 1);
  const start = addUtcDays(today, -historyDays);
  const byDate = new Map<string, number>();

  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  let running = 0;
  let balanceBeforeWindow = 0;

  for (const tx of sorted) {
    // Include everything dated today (not only up to midnight).
    if (tx.date >= todayEnd) continue;
    running += tx.type === TransactionType.INCOME ? tx.amount : -tx.amount;
    if (tx.date >= start) {
      byDate.set(toDateKey(tx.date), roundMoney(running));
    } else {
      balanceBeforeWindow = running;
    }
  }

  const points: ForecastPoint[] = [];
  // Days before the first in-window transaction carry the pre-window balance,
  // not the final one (which made the start of the chart wrong).
  let lastBalance = roundMoney(balanceBeforeWindow);

  for (let offset = -historyDays; offset <= 0; offset += 1) {
    const key = toDateKey(addUtcDays(today, offset));
    const balance = byDate.get(key) ?? lastBalance;
    lastBalance = balance;
    points.push({ date: key, balance, isProjected: false });
  }

  return points;
}
