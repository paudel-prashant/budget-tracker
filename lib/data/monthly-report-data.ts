import { Prisma, TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import {
  formatReportMonthLabel,
  formatReportMonthLong,
  getCurrentMonthKey,
  getMonthDateRange,
  getPreviousMonthKey,
  mergeAvailableMonths,
  parseMonthKey,
} from "@/lib/domain/monthly-report";
import type {
  MonthlyReport,
  MonthlyReportCategoryRow,
  MonthlyReportComparison,
  MonthlyReportDailyPoint,
} from "@/lib/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return roundPercent((part / total) * 100);
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return roundPercent(((current - previous) / Math.abs(previous)) * 100);
}

function buildCategoryRows(
  groups: Array<{ category: string; _sum: { amount: number | null }; _count: { _all: number } }>,
  total: number,
  limit = 8
): MonthlyReportCategoryRow[] {
  return groups
    .map((group) => ({
      category: group.category,
      amount: roundMoney(group._sum.amount ?? 0),
      percentOfTotal: percentOf(group._sum.amount ?? 0, total),
      transactionCount: group._count._all,
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

async function getMonthTotals(
  userId: string,
  start: Date,
  end: Date
): Promise<{ income: number; expenses: number; transactionCount: number }> {
  const where = {
    userId,
    date: { gte: start, lte: end },
  };

  const [incomeResult, expenseResult, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    income: roundMoney(incomeResult._sum.amount ?? 0),
    expenses: roundMoney(expenseResult._sum.amount ?? 0),
    transactionCount,
  };
}

async function getAvailableMonths(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ month: string }>>(
    Prisma.sql`
      SELECT to_char("date", 'YYYY-MM') AS month
      FROM "Transaction"
      WHERE "userId" = ${userId}
      GROUP BY 1
      ORDER BY 1 DESC
    `
  );

  return rows.map((row) => row.month);
}

export async function getMonthlyReport(
  userId: string,
  monthParam?: string | null
): Promise<{ report: MonthlyReport; availableMonths: string[] }> {
  assertDatabaseUrl();
  await processRecurringTransactions(userId);

  const month =
    parseMonthKey(monthParam) ?? parseMonthKey(getCurrentMonthKey()) ?? getCurrentMonthKey();
  const { start, end } = getMonthDateRange(month);
  const previousMonth = getPreviousMonthKey(month);
  const previousRange = getMonthDateRange(previousMonth);

  const userWhere = { userId, date: { gte: start, lte: end } };
  const expenseWhere = { ...userWhere, type: TransactionType.EXPENSE };
  const incomeWhere = { ...userWhere, type: TransactionType.INCOME };

  const [
    monthTotals,
    previousTotals,
    expenseGroups,
    incomeGroups,
    dailyExpenseRows,
    transactionMonths,
  ] = await Promise.all([
    getMonthTotals(userId, start, end),
    getMonthTotals(userId, previousRange.start, previousRange.end),
    prisma.transaction.groupBy({
      by: ["category"],
      where: expenseWhere,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: incomeWhere,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.$queryRaw<Array<{ day: string; amount: number }>>(
      Prisma.sql`
        SELECT to_char("date", 'YYYY-MM-DD') AS day, SUM("amount")::float AS amount
        FROM "Transaction"
        WHERE "userId" = ${userId}
          AND "type" = 'EXPENSE'
          AND "date" >= ${start}
          AND "date" <= ${end}
        GROUP BY 1
        ORDER BY 1 ASC
      `
    ),
    getAvailableMonths(userId),
  ]);

  const savings = roundMoney(monthTotals.income - monthTotals.expenses);
  const previousSavings = roundMoney(previousTotals.income - previousTotals.expenses);

  const comparison: MonthlyReportComparison = {
    previousMonth,
    previousMonthLabel: formatReportMonthLabel(previousMonth),
    incomeChangePercent: changePercent(monthTotals.income, previousTotals.income),
    expenseChangePercent: changePercent(monthTotals.expenses, previousTotals.expenses),
    savingsChangePercent: changePercent(savings, previousSavings),
  };

  const dailyExpenses: MonthlyReportDailyPoint[] = dailyExpenseRows.map((row) => ({
    date: row.day,
    amount: roundMoney(Number(row.amount)),
  }));

  const report: MonthlyReport = {
    month,
    monthLabel: formatReportMonthLabel(month),
    monthLabelLong: formatReportMonthLong(month),
    generatedAt: new Date().toISOString(),
    summary: {
      totalIncome: monthTotals.income,
      totalExpenses: monthTotals.expenses,
      savings,
      savingsRate:
        monthTotals.income > 0
          ? roundPercent((savings / monthTotals.income) * 100)
          : null,
      transactionCount: monthTotals.transactionCount,
    },
    comparison,
    topExpenseCategories: buildCategoryRows(expenseGroups, monthTotals.expenses),
    topIncomeCategories: buildCategoryRows(incomeGroups, monthTotals.income),
    charts: {
      incomeVsExpenses: {
        month,
        income: monthTotals.income,
        expenses: monthTotals.expenses,
      },
      expenseByCategory: buildCategoryRows(expenseGroups, monthTotals.expenses, 10).map(
        ({ category, amount }) => ({ category, amount })
      ),
      dailyExpenses,
    },
  };

  return {
    report,
    availableMonths: mergeAvailableMonths(transactionMonths, month),
  };
}
