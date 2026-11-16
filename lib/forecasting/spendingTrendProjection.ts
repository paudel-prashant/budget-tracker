import { TransactionType } from "@prisma/client";
import type { RecurringForecastEvent, SpendingTrendMetrics } from "@/lib/forecasting/types";
import { roundMoney, toDateKey } from "@/lib/forecasting/types";

export type HistoricalTransaction = {
  date: Date;
  amount: number;
  type: TransactionType;
  category: string;
  recurringTransactionId: string | null;
};

type WindowConfig = {
  days: number;
  weight: number;
};

/** Recent behaviour counts most, but longer windows smooth out one-off months. */
const WINDOWS: WindowConfig[] = [
  { days: 30, weight: 3 },
  { days: 90, weight: 2 },
  { days: 180, weight: 1 },
];

const MAX_HISTORY_DAYS = 180;
/** Minimum non-zero days before outlier capping kicks in (fences are noise below this). */
const MIN_DAYS_FOR_CAPPING = 8;
const MS_PER_DAY = 86_400_000;

type DailySeries = {
  /** All expenses — what the user actually spent (for display). */
  totalExpense: number[];
  totalIncome: number[];
  /** Non-recurring only — recurring items are projected from their schedule instead. */
  variableExpense: number[];
  variableIncome: number[];
};

function startOfUtcDay(date: Date): Date {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

/**
 * One entry per calendar day, oldest first, covering `days` days ending today.
 * Days without transactions are zeros — they're real "spent nothing" days.
 */
function buildDailySeries(
  transactions: HistoricalTransaction[],
  todayStart: Date,
  days: number
): DailySeries {
  const series: DailySeries = {
    totalExpense: new Array(days).fill(0),
    totalIncome: new Array(days).fill(0),
    variableExpense: new Array(days).fill(0),
    variableIncome: new Array(days).fill(0),
  };
  const firstDay = todayStart.getTime() - (days - 1) * MS_PER_DAY;

  for (const tx of transactions) {
    const index = Math.floor((startOfUtcDay(tx.date).getTime() - firstDay) / MS_PER_DAY);
    if (index < 0 || index >= days) continue;

    const isRecurring = Boolean(tx.recurringTransactionId);
    if (tx.type === TransactionType.INCOME) {
      series.totalIncome[index] += tx.amount;
      if (!isRecurring) series.variableIncome[index] += tx.amount;
    } else {
      series.totalExpense[index] += tx.amount;
      if (!isRecurring) series.variableExpense[index] += tx.amount;
    }
  }

  return series;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/**
 * Tukey "far out" fence (Q3 + 3·IQR) over the days that had activity. One-off spikes —
 * a laptop, a gold purchase, a tax refund — are capped so they don't get projected as if
 * they happened every month. Returns Infinity when there's too little data to judge.
 */
export function outlierCap(values: number[]): number {
  const active = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (active.length < MIN_DAYS_FOR_CAPPING) return Number.POSITIVE_INFINITY;
  const q1 = quantile(active, 0.25);
  const q3 = quantile(active, 0.75);
  return q3 + 3 * Math.max(q3 - q1, q3 * 0.25);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1));
}

function coefficientOfVariation(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return 0;
  return standardDeviation(values) / avg;
}

/** Weighted average of the per-day mean over each window (clipped to the history we have). */
function weightedDailyAverage(series: number[], historyDays: number): number {
  let weighted = 0;
  let weightTotal = 0;

  for (const window of WINDOWS) {
    const span = Math.min(window.days, historyDays, series.length);
    if (span <= 0) continue;
    weighted += mean(series.slice(series.length - span)) * window.weight;
    weightTotal += window.weight;
  }

  return weightTotal > 0 ? weighted / weightTotal : 0;
}

export function calculateSpendingTrends(
  transactions: HistoricalTransaction[],
  _recurringEvents: RecurringForecastEvent[],
  asOf: Date = new Date()
): SpendingTrendMetrics {
  const todayStart = startOfUtcDay(asOf);
  const todayEnd = new Date(todayStart.getTime() + MS_PER_DAY - 1);
  const past = transactions.filter((tx) => tx.date <= todayEnd);

  // Average over the history that actually exists: a user with 3 weeks of data
  // shouldn't have their spending divided across 180 days.
  const firstDate = past.reduce<Date | null>(
    (earliest, tx) => (!earliest || tx.date < earliest ? tx.date : earliest),
    null
  );
  const historyDays = firstDate
    ? Math.min(
        MAX_HISTORY_DAYS,
        Math.floor((todayStart.getTime() - startOfUtcDay(firstDate).getTime()) / MS_PER_DAY) + 1
      )
    : 0;

  const series = buildDailySeries(past, todayStart, Math.max(historyDays, 1));

  const expenseCap = outlierCap(series.variableExpense);
  const incomeCap = outlierCap(series.variableIncome);
  const cappedExpense = series.variableExpense.map((value) => Math.min(value, expenseCap));
  const cappedIncome = series.variableIncome.map((value) => Math.min(value, incomeCap));

  const averageDailySpending = roundMoney(weightedDailyAverage(series.totalExpense, historyDays));
  const averageDailyIncome = roundMoney(weightedDailyAverage(series.totalIncome, historyDays));
  const variableDailyExpense = roundMoney(weightedDailyAverage(cappedExpense, historyDays));
  const variableDailyIncome = roundMoney(weightedDailyAverage(cappedIncome, historyDays));

  // Day-to-day uncertainty of the non-recurring net flow, from the last 90 days.
  const recentSpan = Math.min(90, cappedExpense.length);
  const recentNet = cappedIncome
    .slice(-recentSpan)
    .map((income, i) => income - cappedExpense[cappedExpense.length - recentSpan + i]);
  const variableDailyStdDev = historyDays >= 7 ? roundMoney(standardDeviation(recentNet)) : 0;

  // Volatility keeps its original meaning: variation across days that had spending (30d).
  const recent30 = series.totalExpense.slice(-Math.min(30, series.totalExpense.length));
  const sampleDayCount = new Set(past.map((tx) => toDateKey(tx.date))).size;

  const last90Start = new Date(todayStart.getTime() - 89 * MS_PER_DAY);
  let recurringExpenseAmount = 0;
  let totalExpenseAmount = 0;
  const categoryTotals = new Map<string, number>();

  for (const tx of past) {
    if (tx.type !== TransactionType.EXPENSE) continue;
    if (tx.date >= last90Start) {
      totalExpenseAmount += tx.amount;
      if (tx.recurringTransactionId) recurringExpenseAmount += tx.amount;
    }
    if (!tx.recurringTransactionId) {
      categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + tx.amount);
    }
  }

  const recurringExpenseShare =
    totalExpenseAmount > 0 ? roundMoney((recurringExpenseAmount / totalExpenseAmount) * 100) : 0;

  let topVariableCategory: string | null = null;
  let topVariableCategoryShare = 0;
  const variableTotal = Array.from(categoryTotals.values()).reduce((sum, value) => sum + value, 0);

  for (const [category, amount] of categoryTotals.entries()) {
    const share = variableTotal > 0 ? (amount / variableTotal) * 100 : 0;
    if (share > topVariableCategoryShare) {
      topVariableCategory = category;
      topVariableCategoryShare = roundMoney(share);
    }
  }

  return {
    averageDailySpending,
    averageWeeklySpending: roundMoney(averageDailySpending * 7),
    averageMonthlySpending: roundMoney(averageDailySpending * 30),
    averageDailyIncome,
    variableDailyExpense,
    variableDailyIncome,
    variableDailyStdDev,
    historyDays,
    spendingVolatility: roundMoney(
      coefficientOfVariation(recent30.filter((value) => value > 0)) * 100
    ),
    sampleDayCount: Math.min(sampleDayCount, MAX_HISTORY_DAYS),
    topVariableCategory,
    topVariableCategoryShare,
    recurringExpenseShare: Math.min(100, Math.max(0, recurringExpenseShare)),
  };
}
