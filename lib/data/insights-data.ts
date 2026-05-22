import { Prisma, TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import type {
  CategorySpendingInsight,
  FinancialInsights,
  MonthlySavingsPoint,
  SpendingSpike,
  TrendDirection,
} from "@/lib/types";

const SPENDING_SPIKE_THRESHOLD_PERCENT = 25;

type MonthlyAggregateRow = {
  month: string;
  income: number;
  expenses: number;
};

type ExpenseDayStatsRow = {
  total: number;
  days: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function getTrendDirection(changePercent: number | null): TrendDirection {
  if (changePercent === null || Math.abs(changePercent) < 0.5) return "flat";
  return changePercent > 0 ? "up" : "down";
}

function buildSavingsTrend(
  monthly: MonthlySavingsPoint[]
): Pick<FinancialInsights, "savingsTrendDirection" | "savingsTrendChangePercent"> {
  if (monthly.length < 2) {
    return { savingsTrendDirection: "flat", savingsTrendChangePercent: null };
  }

  const previous = monthly[monthly.length - 2].savings;
  const current = monthly[monthly.length - 1].savings;

  if (previous === 0) {
    return {
      savingsTrendDirection: current > 0 ? "up" : current < 0 ? "down" : "flat",
      savingsTrendChangePercent: current === 0 ? 0 : null,
    };
  }

  const changePercent = roundPercent(((current - previous) / Math.abs(previous)) * 100);

  return {
    savingsTrendDirection: getTrendDirection(changePercent),
    savingsTrendChangePercent: changePercent,
  };
}

function detectSpendingSpikes(
  monthly: Array<{ month: string; expenses: number }>
): SpendingSpike[] {
  const spikes: SpendingSpike[] = [];

  for (let i = 1; i < monthly.length; i += 1) {
    const previousExpenses = monthly[i - 1].expenses;
    const expenses = monthly[i].expenses;

    if (previousExpenses <= 0) continue;

    const changePercent = roundPercent(
      ((expenses - previousExpenses) / previousExpenses) * 100
    );

    if (changePercent >= SPENDING_SPIKE_THRESHOLD_PERCENT) {
      spikes.push({
        month: monthly[i].month,
        expenses,
        previousExpenses,
        changePercent,
      });
    }
  }

  return spikes.sort((a, b) => b.changePercent - a.changePercent);
}

export async function getFinancialInsights(userId: string): Promise<FinancialInsights> {
  assertDatabaseUrl();
  await processRecurringTransactions(userId);

  const userFilter = Prisma.sql`"userId" = ${userId}`;

  const [categoryGroups, incomeResult, expenseResult, monthlyRows, expenseDayStats] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ["category"],
        where: { userId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<MonthlyAggregateRow[]>(Prisma.sql`
        SELECT
          TO_CHAR(date, 'YYYY-MM') AS month,
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)::float AS income,
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)::float AS expenses
        FROM "Transaction"
        WHERE ${userFilter}
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month ASC
      `),
      prisma.$queryRaw<ExpenseDayStatsRow[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(amount), 0)::float AS total,
          COUNT(DISTINCT DATE(date))::int AS days
        FROM "Transaction"
        WHERE type = 'EXPENSE' AND ${userFilter}
      `),
    ]);

  const totalIncome = roundMoney(incomeResult._sum.amount ?? 0);
  const totalExpenses = roundMoney(expenseResult._sum.amount ?? 0);

  const categoryBreakdown = categoryGroups.map((row) => ({
    category: row.category,
    amount: roundMoney(row._sum.amount ?? 0),
  }));

  const topCategory = categoryBreakdown[0] ?? null;

  const highestSpendingCategory: CategorySpendingInsight | null = topCategory
    ? {
        category: topCategory.category,
        amount: topCategory.amount,
        percentOfTotal:
          totalExpenses > 0
            ? roundPercent((topCategory.amount / totalExpenses) * 100)
            : 0,
      }
    : null;

  const monthlySavingsTrend: MonthlySavingsPoint[] = monthlyRows.map((row) => ({
    month: row.month,
    income: roundMoney(row.income),
    expenses: roundMoney(row.expenses),
    savings: roundMoney(row.income - row.expenses),
  }));

  const savingsTrend = buildSavingsTrend(monthlySavingsTrend);

  const expenseStats = expenseDayStats[0] ?? { total: 0, days: 0 };
  const expenseDaysCount = expenseStats.days;
  const averageDailySpending =
    expenseDaysCount > 0 ? roundMoney(expenseStats.total / expenseDaysCount) : 0;

  const incomeExpenseRatio =
    totalExpenses > 0 ? roundPercent((totalIncome / totalExpenses) * 100) / 100 : null;

  const mostExpensiveMonthEntry = [...monthlySavingsTrend].sort(
    (a, b) => b.expenses - a.expenses
  )[0];

  const mostExpensiveMonth =
    mostExpensiveMonthEntry && mostExpensiveMonthEntry.expenses > 0
      ? {
          month: mostExpensiveMonthEntry.month,
          expenses: mostExpensiveMonthEntry.expenses,
        }
      : null;

  const spendingSpikes = detectSpendingSpikes(monthlySavingsTrend);

  return {
    highestSpendingCategory,
    monthlySavingsTrend,
    ...savingsTrend,
    averageDailySpending,
    expenseDaysCount,
    incomeExpenseRatio,
    totalIncome,
    totalExpenses,
    mostExpensiveMonth,
    spendingSpikes,
    categoryBreakdown,
  };
}
