import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { getCashFlowForecast } from "@/lib/data/forecast-data";
import { projectRecurringEvents } from "@/lib/forecasting";
import { addUtcDays, roundMoney, toDateKey } from "@/lib/forecasting/types";
import { startOfUtcDay } from "@/lib/domain/recurrence-dates";
import {
  chooseForecastTimeframe,
  getMonthDayKeys,
  summarizeMonthForecast,
  type DayBalance,
} from "@/lib/domain/bills-calendar";
import type { ForecastConfidence } from "@/lib/forecasting/types";

export type BillsCalendarEvent = {
  date: string;
  recurringId: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  /** Before today — the recurring processor has already posted it. */
  isPast: boolean;
};

export type BillsCalendar = {
  month: number;
  year: number;
  events: BillsCalendarEvent[];
  totals: { income: number; expenses: number; remainingExpenses: number };
  /** Null when the month is past or beyond the 180-day forecast. */
  forecast: {
    confidence: ForecastConfidence;
    currentBalance: number;
    dailyBalances: DayBalance[];
    shortfall: DayBalance | null;
    lowestBalance: DayBalance | null;
  } | null;
};

/**
 * Scheduled recurring income and bills for one month, plus the forecast engine's
 * projected end-of-day balance for its remaining days (incl. estimated everyday spending).
 */
export async function getBillsCalendar(
  userId: string,
  month: number,
  year: number
): Promise<BillsCalendar> {
  assertDatabaseUrl();

  const dayKeys = getMonthDayKeys(month, year);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const todayKey = toDateKey(startOfUtcDay(new Date()));

  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      amount: true,
      type: true,
      category: true,
      frequency: true,
      startDate: true,
      endDate: true,
    },
  });

  // projectRecurringEvents returns occurrences strictly after `from`.
  const events: BillsCalendarEvent[] = projectRecurringEvents(
    recurring,
    addUtcDays(monthStart, -1),
    monthEnd
  ).map((event) => ({
    date: event.date,
    recurringId: event.recurringId,
    title: event.title,
    amount: event.amount,
    type: event.type,
    category: event.category,
    isPast: event.date < todayKey,
  }));

  const sum = (items: BillsCalendarEvent[]) =>
    roundMoney(items.reduce((total, event) => total + event.amount, 0));
  const expenses = events.filter((event) => event.type === "EXPENSE");

  const totals = {
    income: sum(events.filter((event) => event.type === "INCOME")),
    expenses: sum(expenses),
    remainingExpenses: sum(expenses.filter((event) => !event.isPast)),
  };

  const timeframe = chooseForecastTimeframe(dayKeys[dayKeys.length - 1], todayKey);
  let forecast: BillsCalendar["forecast"] = null;

  if (timeframe) {
    const result = await getCashFlowForecast(userId, timeframe);
    forecast = {
      confidence: result.confidence,
      currentBalance: result.currentBalance,
      ...summarizeMonthForecast(result.forecastPoints, dayKeys),
    };
  }

  return { month, year, events, totals, forecast };
}
