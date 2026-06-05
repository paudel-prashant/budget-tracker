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
};

function groupEventsByDate(events: RecurringForecastEvent[]): Map<string, RecurringForecastEvent[]> {
  const grouped = new Map<string, RecurringForecastEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.date) ?? [];
    existing.push(event);
    grouped.set(event.date, existing);
  }

  return grouped;
}

function estimateVariableDailyExpense(trends: SpendingTrendMetrics): number {
  const recurringDaily = trends.averageDailySpending * (trends.recurringExpenseShare / 100);
  return Math.max(0, trends.averageDailySpending - recurringDaily * 0.85);
}

export function projectBalance(input: ProjectBalanceInput): ForecastPoint[] {
  const today = startOfUtcDay(new Date());
  const eventsByDate = groupEventsByDate(input.recurringEvents);
  const variableDailyExpense = estimateVariableDailyExpense(input.trends);

  const historical = input.historicalPoints.filter((point) => !point.isProjected);
  const lastHistorical = historical[historical.length - 1];
  let balance = lastHistorical?.balance ?? input.currentBalance;

  const points: ForecastPoint[] = [...historical];

  if (points.length === 0) {
    points.push({
      date: toDateKey(today),
      balance: roundMoney(input.currentBalance),
      isProjected: false,
    });
    balance = input.currentBalance;
  }

  for (let day = 1; day <= input.forecastDays; day += 1) {
    const date = addUtcDays(today, day);
    const dateKey = toDateKey(date);
    const dayEvents = eventsByDate.get(dateKey) ?? [];

    let income = 0;
    let expenses = variableDailyExpense;

    for (const event of dayEvents) {
      if (event.type === TransactionType.INCOME) {
        income += event.amount;
      } else {
        expenses += event.amount;
      }
    }

    balance = roundMoney(balance + income - expenses);

    points.push({
      date: dateKey,
      balance,
      isProjected: true,
      income: roundMoney(income),
      expenses: roundMoney(expenses),
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
  historyDays: number
): ForecastPoint[] {
  const today = startOfUtcDay(new Date());
  const start = addUtcDays(today, -historyDays);
  const byDate = new Map<string, number>();

  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  let running = 0;

  for (const tx of sorted) {
    if (tx.date > today) continue;
    running += tx.type === TransactionType.INCOME ? tx.amount : -tx.amount;
    if (tx.date >= start) {
      byDate.set(toDateKey(tx.date), roundMoney(running));
    }
  }

  const points: ForecastPoint[] = [];
  let lastBalance = running;

  for (let offset = -historyDays; offset <= 0; offset += 1) {
    const date = addUtcDays(today, offset);
    const key = toDateKey(date);
    const balance = byDate.get(key) ?? lastBalance;
    lastBalance = balance;
    points.push({ date: key, balance, isProjected: false });
  }

  return points;
}
