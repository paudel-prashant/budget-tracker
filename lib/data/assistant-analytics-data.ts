import { Prisma, TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { getDashboardBudgetData } from "@/lib/data/budget-data";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import {
  getCurrentMonthKey,
  getMonthDateRange,
  getPreviousMonthKey,
} from "@/lib/domain/monthly-report";
import type {
  AssistantAnalyticsSnapshot,
  CategoryMonthComparison,
  MonthTotals,
  MonthlyTrendPoint,
  UnusualExpenseItem,
} from "@/lib/assistant/types";
import { formatMonth } from "@/lib/utils/format";

const UNUSUAL_EXPENSE_MULTIPLIER = 2.5;
const SPIKE_THRESHOLD_PERCENT = 25;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeSavingsRate(income: number, savings: number): number | null {
  if (income <= 0) return null;
  return roundPercent((savings / income) * 100);
}

function buildMonthTotals(income: number, expenses: number): MonthTotals {
  const savings = roundMoney(income - expenses);
  return {
    income: roundMoney(income),
    expenses: roundMoney(expenses),
    savings,
    savingsRate: computeSavingsRate(income, savings),
  };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return roundPercent(((current - previous) / previous) * 100);
}

async function getMonthExpenseByCategory(
  userId: string,
  monthKey: string
): Promise<Map<string, number>> {
  const { start, end } = getMonthDateRange(monthKey);
  const rows = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });

  return new Map(
    rows.map((row) => [row.category, roundMoney(row._sum.amount ?? 0)])
  );
}

function buildCategoryComparisons(
  currentMap: Map<string, number>,
  previousMap: Map<string, number>
): CategoryMonthComparison[] {
  const categories = new Set([...currentMap.keys(), ...previousMap.keys()]);

  return [...categories]
    .map((category) => {
      const currentAmount = currentMap.get(category) ?? 0;
      const previousAmount = previousMap.get(category) ?? 0;
      const changeAmount = roundMoney(currentAmount - previousAmount);
      return {
        category,
        currentAmount,
        previousAmount,
        changeAmount,
        changePercent: percentChange(currentAmount, previousAmount),
      };
    })
    .sort((a, b) => b.changeAmount - a.changeAmount);
}

function detectUnusualExpenses(
  userId: string,
  monthKey: string,
  categoryAverages: Map<string, number>
): Promise<UnusualExpenseItem[]> {
  const { start, end } = getMonthDateRange(monthKey);

  return prisma.transaction
    .findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lte: end },
      },
      orderBy: { amount: "desc" },
      take: 40,
    })
    .then((rows) => {
      const unusual: UnusualExpenseItem[] = [];

      for (const row of rows) {
        const avg = categoryAverages.get(row.category) ?? 0;
        const isLargeVsAvg = avg > 0 && row.amount >= avg * UNUSUAL_EXPENSE_MULTIPLIER;
        const isTopAmount = row.amount >= 200;

        if (!isLargeVsAvg && !isTopAmount) continue;

        unusual.push({
          title: row.title,
          category: row.category,
          amount: roundMoney(row.amount),
          date: row.date.toISOString(),
          reason: isLargeVsAvg
            ? `Over ${UNUSUAL_EXPENSE_MULTIPLIER}× this category's typical charge`
            : "Among your largest expenses this month",
        });
      }

      return unusual.slice(0, 5);
    });
}

export async function getAssistantAnalyticsSnapshot(
  userId: string
): Promise<AssistantAnalyticsSnapshot> {
  assertDatabaseUrl();
  await processRecurringTransactions(userId);

  const currentMonth = getCurrentMonthKey();
  const previousMonth = getPreviousMonthKey(currentMonth);
  const userFilter = Prisma.sql`"userId" = ${userId}`;

  const [
    transactionCount,
    incomeAll,
    expenseAll,
    monthlyRows,
    currentCategoryMap,
    previousCategoryMap,
    expenseDays,
    budgetData,
  ] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.$queryRaw<
      Array<{ month: string; income: number; expenses: number }>
    >(Prisma.sql`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)::float AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)::float AS expenses
      FROM "Transaction"
      WHERE ${userFilter}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `),
    getMonthExpenseByCategory(userId, currentMonth),
    getMonthExpenseByCategory(userId, previousMonth),
    prisma.$queryRaw<Array<{ days: number }>>(Prisma.sql`
      SELECT COUNT(DISTINCT DATE(date))::int AS days
      FROM "Transaction"
      WHERE type = 'EXPENSE' AND ${userFilter}
        AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}
    `),
    getDashboardBudgetData(userId),
  ]);

  const monthlyTrend: MonthlyTrendPoint[] = monthlyRows.map((row) => ({
    month: row.month,
    income: roundMoney(row.income),
    expenses: roundMoney(row.expenses),
    savings: roundMoney(row.income - row.expenses),
  }));

  const currentRow = monthlyTrend.find((m) => m.month === currentMonth);
  const previousRow = monthlyTrend.find((m) => m.month === previousMonth);

  const current = buildMonthTotals(
    currentRow?.income ?? 0,
    currentRow?.expenses ?? 0
  );
  const previous = buildMonthTotals(
    previousRow?.income ?? 0,
    previousRow?.expenses ?? 0
  );

  const lifetime = buildMonthTotals(
    incomeAll._sum.amount ?? 0,
    expenseAll._sum.amount ?? 0
  );

  const categoryComparisons = buildCategoryComparisons(
    currentCategoryMap,
    previousCategoryMap
  );

  const totalCurrentExpenses = current.expenses;
  const topExpenseCategories = [...categoryComparisons]
    .filter((c) => c.currentAmount > 0)
    .sort((a, b) => b.currentAmount - a.currentAmount)
    .slice(0, 5)
    .map((c) => ({
      category: c.category,
      amount: c.currentAmount,
      sharePercent:
        totalCurrentExpenses > 0
          ? roundPercent((c.currentAmount / totalCurrentExpenses) * 100)
          : 0,
    }));

  const categoryAverages = new Map<string, number>();
  for (const row of categoryComparisons) {
    if (row.previousAmount > 0) {
      categoryAverages.set(row.category, row.previousAmount);
    }
  }

  const unusualExpenses = await detectUnusualExpenses(
    userId,
    currentMonth,
    categoryAverages
  );

  const daysWithExpenses = expenseDays[0]?.days ?? 0;
  const averageDailySpend =
    daysWithExpenses > 0 ? roundMoney(current.expenses / daysWithExpenses) : 0;

  const topBudgetRisks = budgetData.warnings
    .filter((b) => b.isOverBudget || b.isAtRisk)
    .slice(0, 3)
    .map((b) => ({ category: b.category, percentUsed: b.percentUsed }));

  return {
    currentMonth,
    previousMonth,
    currentMonthLabel: formatMonth(currentMonth),
    previousMonthLabel: formatMonth(previousMonth),
    hasTransactions: transactionCount > 0,
    transactionCount,
    lifetime,
    current,
    previous,
    expenseChangePercent: percentChange(current.expenses, previous.expenses),
    incomeChangePercent: percentChange(current.income, previous.income),
    monthlyTrend,
    categoryComparisons,
    topExpenseCategories,
    unusualExpenses,
    averageDailySpend,
    topBudgetRisks,
  };
}
