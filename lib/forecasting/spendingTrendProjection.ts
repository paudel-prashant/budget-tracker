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

const WINDOWS: WindowConfig[] = [
  { days: 30, weight: 3 },
  { days: 90, weight: 2 },
  { days: 180, weight: 1 },
];

function getDailyTotals(
  transactions: HistoricalTransaction[],
  asOf: Date,
  windowDays: number
): Map<string, { expenses: number; income: number }> {
  const start = new Date(asOf);
  start.setUTCDate(start.getUTCDate() - windowDays + 1);
  start.setUTCHours(0, 0, 0, 0);

  const totals = new Map<string, { expenses: number; income: number }>();

  for (const tx of transactions) {
    if (tx.date < start || tx.date > asOf) continue;
    const key = toDateKey(tx.date);
    const existing = totals.get(key) ?? { expenses: 0, income: 0 };

    if (tx.type === TransactionType.INCOME) {
      existing.income += tx.amount;
    } else {
      existing.expenses += tx.amount;
    }

    totals.set(key, existing);
  }

  return totals;
}

function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function calculateSpendingTrends(
  transactions: HistoricalTransaction[],
  _recurringEvents: RecurringForecastEvent[],
  asOf: Date = new Date()
): SpendingTrendMetrics {
  const today = new Date(asOf);
  today.setUTCHours(23, 59, 59, 999);

  let weightedExpenseSum = 0;
  let weightedIncomeSum = 0;
  let weightTotal = 0;
  let sampleDayCount = 0;
  const recentDailyExpenses: number[] = [];

  for (const window of WINDOWS) {
    const dailyTotals = getDailyTotals(transactions, today, window.days);
    const daysWithData = dailyTotals.size;
    if (daysWithData === 0) continue;

    let windowExpenses = 0;
    let windowIncome = 0;

    for (const totals of dailyTotals.values()) {
      windowExpenses += totals.expenses;
      windowIncome += totals.income;
    }

    const avgDailyExpense = windowExpenses / window.days;
    const avgDailyIncome = windowIncome / window.days;

    weightedExpenseSum += avgDailyExpense * window.weight;
    weightedIncomeSum += avgDailyIncome * window.weight;
    weightTotal += window.weight;
    sampleDayCount = Math.max(sampleDayCount, daysWithData);

    if (window.days === 30) {
      for (const totals of dailyTotals.values()) {
        recentDailyExpenses.push(totals.expenses);
      }
    }
  }

  const averageDailySpending =
    weightTotal > 0 ? roundMoney(weightedExpenseSum / weightTotal) : 0;
  const averageDailyIncome =
    weightTotal > 0 ? roundMoney(weightedIncomeSum / weightTotal) : 0;

  const last90 = new Date(today);
  last90.setUTCDate(last90.getUTCDate() - 90);

  let recurringExpenseAmount = 0;
  let totalExpenseAmount = 0;

  for (const tx of transactions) {
    if (tx.type !== TransactionType.EXPENSE || tx.date > today || tx.date < last90) continue;
    totalExpenseAmount += tx.amount;
    if (tx.recurringTransactionId) {
      recurringExpenseAmount += tx.amount;
    }
  }

  const recurringExpenseShare =
    totalExpenseAmount > 0
      ? roundMoney((recurringExpenseAmount / totalExpenseAmount) * 100)
      : 0;

  const categoryTotals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== TransactionType.EXPENSE || tx.recurringTransactionId) continue;
    if (tx.date > today) continue;
    categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + tx.amount);
  }

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
    spendingVolatility: roundMoney(coefficientOfVariation(recentDailyExpenses) * 100),
    sampleDayCount,
    topVariableCategory,
    topVariableCategoryShare,
    recurringExpenseShare: Math.min(100, Math.max(0, recurringExpenseShare)),
  };
}
