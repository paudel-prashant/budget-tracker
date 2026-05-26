import { TransactionType } from "@prisma/client";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import {
  buildBalanceOverTimeData,
  buildMonthlyIncomeExpenseData,
} from "@/lib/domain/chart-data";
import { buildDashboardInsights } from "@/lib/domain/dashboard-insights";
import {
  getRangeStartDateKey,
  toDashboardDateRange,
  type ResolvedDashboardDateRange,
} from "@/lib/domain/dashboard-date-range";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import type { DashboardMetrics, Transaction } from "@/lib/types";

function serializeTransaction(transaction: {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  createdAt: Date;
}): Transaction {
  return {
    id: transaction.id,
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
  };
}

const transactionSelect = {
  id: true,
  title: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  createdAt: true,
} as const;

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

  const [transactionsInRange, incomeResult, expenseResult, incomeBefore, expenseBefore] =
    await Promise.all([
      prisma.transaction.findMany({
        where: rangeWhere,
        orderBy: { date: "asc" },
        select: transactionSelect,
      }),
      prisma.transaction.aggregate({
        where: { ...rangeWhere, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...rangeWhere, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...beforeRangeWhere, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...beforeRangeWhere, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

  const serialized = transactionsInRange.map(serializeTransaction);
  const totalIncome = incomeResult._sum.amount ?? 0;
  const totalExpenses = expenseResult._sum.amount ?? 0;
  const openingBalance =
    (incomeBefore._sum.amount ?? 0) - (expenseBefore._sum.amount ?? 0);

  const summary = {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };

  const monthlyChartData = buildMonthlyIncomeExpenseData(serialized);

  return {
    summary,
    balanceChartData: buildBalanceOverTimeData(serialized, {
      openingBalance,
      rangeStartDate: getRangeStartDateKey(range),
    }),
    monthlyChartData,
    insights: buildDashboardInsights(serialized, summary, monthlyChartData),
    dateRange: toDashboardDateRange(range),
  };
}
