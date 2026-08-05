import { Prisma, TransactionType } from "@prisma/client";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import {
  buildBalanceOverTimeData,
  buildMonthlyIncomeExpenseData,
} from "@/lib/domain/chart-data";
import { buildDashboardInsights } from "@/lib/domain/dashboard-insights";
import { buildDashboardKpis } from "@/lib/domain/dashboard-kpis";
import {
  getPreviousDashboardDateRange,
  getRangeStartDateKey,
  toDashboardDateRange,
  type ResolvedDashboardDateRange,
} from "@/lib/domain/dashboard-date-range";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { serializeTransaction } from "@/lib/services/serialize-transaction";
import type { CategorySpendingInsight, DashboardMetrics } from "@/lib/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function toTopCategory(
  rows: Array<{ category: string; _sum: { baseAmount: number | null } }>,
  totalExpenses: number
): CategorySpendingInsight | null {
  const top = rows[0];
  if (!top || totalExpenses <= 0) {
    return null;
  }

  const amount = roundMoney(top._sum.baseAmount ?? 0);
  return {
    category: top.category,
    amount,
    percentOfTotal: roundPercent((amount / totalExpenses) * 100),
  };
}

const transactionSelect = {
  id: true,
  title: true,
  amount: true,
  currency: true,
  baseAmount: true,
  type: true,
  category: true,
  date: true,
  tags: true,
  createdAt: true,
} as const;

type ExpenseDayStatsRow = {
  total: number;
  days: number;
};

export async function getDashboardMetrics(
  userId: string,
  range: ResolvedDashboardDateRange
): Promise<DashboardMetrics> {
  assertDatabaseUrl();

  await processRecurringTransactions(userId);

  const userWhere = { userId };
  const rangeWhere = {
    ...userWhere,
    date: { gte: range.start, lte: range.end },
  };
  const beforeRangeWhere = {
    ...userWhere,
    date: { lt: range.start },
  };

  const previousRange = getPreviousDashboardDateRange(range);
  const previousRangeWhere = {
    ...userWhere,
    date: { gte: previousRange.start, lte: previousRange.end },
  };

  const rangeDateFilter = Prisma.sql`"userId" = ${userId} AND date >= ${range.start} AND date <= ${range.end}`;
  const previousDateFilter = Prisma.sql`"userId" = ${userId} AND date >= ${previousRange.start} AND date <= ${previousRange.end}`;

  const [
    transactionsInRange,
    incomeResult,
    expenseResult,
    incomeBefore,
    expenseBefore,
    previousIncomeResult,
    previousExpenseResult,
    categoryGroups,
    previousTopCategoryRows,
    expenseDayStats,
    previousExpenseDayStats,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: rangeWhere,
      orderBy: { date: "asc" },
      select: transactionSelect,
    }),
    prisma.transaction.aggregate({
      where: { ...rangeWhere, type: TransactionType.INCOME },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...rangeWhere, type: TransactionType.EXPENSE },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...beforeRangeWhere, type: TransactionType.INCOME },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...beforeRangeWhere, type: TransactionType.EXPENSE },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...previousRangeWhere, type: TransactionType.INCOME },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...previousRangeWhere, type: TransactionType.EXPENSE },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: { ...rangeWhere, type: TransactionType.EXPENSE },
      _sum: { baseAmount: true },
      orderBy: { _sum: { baseAmount: "desc" } },
      take: 1,
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: { ...previousRangeWhere, type: TransactionType.EXPENSE },
      _sum: { baseAmount: true },
      orderBy: { _sum: { baseAmount: "desc" } },
      take: 1,
    }),
    prisma.$queryRaw<ExpenseDayStatsRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM("baseAmount"), 0)::float AS total,
        COUNT(DISTINCT DATE(date))::int AS days
      FROM "Transaction"
      WHERE type = 'EXPENSE' AND ${rangeDateFilter}
    `),
    prisma.$queryRaw<ExpenseDayStatsRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM("baseAmount"), 0)::float AS total,
        COUNT(DISTINCT DATE(date))::int AS days
      FROM "Transaction"
      WHERE type = 'EXPENSE' AND ${previousDateFilter}
    `),
  ]);

  const serialized = transactionsInRange.map(serializeTransaction);
  const totalIncome = incomeResult._sum.baseAmount ?? 0;
  const totalExpenses = expenseResult._sum.baseAmount ?? 0;
  const openingBalance =
    (incomeBefore._sum.baseAmount ?? 0) - (expenseBefore._sum.baseAmount ?? 0);

  const summary = {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };

  const previousSummary = {
    totalIncome: previousIncomeResult._sum.baseAmount ?? 0,
    totalExpenses: previousExpenseResult._sum.baseAmount ?? 0,
    netBalance:
      (previousIncomeResult._sum.baseAmount ?? 0) - (previousExpenseResult._sum.baseAmount ?? 0),
  };

  const monthlyChartData = buildMonthlyIncomeExpenseData(serialized);
  const topCategory = toTopCategory(categoryGroups, totalExpenses);
  const expenseStats = expenseDayStats[0] ?? { total: 0, days: 0 };
  const previousExpenseStats = previousExpenseDayStats[0] ?? { total: 0, days: 0 };

  const kpis = buildDashboardKpis({
    summary,
    previousSummary,
    topCategory,
    previousTopCategoryAmount: roundMoney(previousTopCategoryRows[0]?._sum.baseAmount ?? 0),
    expenseDaysCount: expenseStats.days,
    previousExpenseDaysCount: previousExpenseStats.days,
    range,
  });

  return {
    summary,
    balanceChartData: buildBalanceOverTimeData(serialized, {
      openingBalance,
      rangeStartDate: getRangeStartDateKey(range),
    }),
    monthlyChartData,
    insights: buildDashboardInsights(serialized, summary, monthlyChartData),
    kpis,
    dateRange: toDashboardDateRange(range),
  };
}
