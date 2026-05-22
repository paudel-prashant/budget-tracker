import { TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { getCurrentMonthKey, getMonthDateRange } from "@/lib/domain/monthly-report";
import { buildMonthlyIncomeExpenseData } from "@/lib/domain/chart-data";
import { prisma } from "@/lib/db/prisma";
import { serializeTransaction } from "@/lib/services/serialize-transaction";
import type {
  Asset,
  Liability,
  NetWorthDashboardData,
  NetWorthHistoryPoint,
  Transaction,
} from "@/lib/types";

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

function serializeAsset(row: {
  id: string;
  name: string;
  category: string;
  value: number;
  asOfDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Asset {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    value: row.value,
    asOfDate: row.asOfDate.toISOString(),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeLiability(row: {
  id: string;
  name: string;
  category: string;
  value: number;
  asOfDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Liability {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    value: row.value,
    asOfDate: row.asOfDate.toISOString(),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getMonthTransactionTotals(
  userId: string,
  monthKey: string
): Promise<{ income: number; expenses: number; savings: number; savingsRate: number | null }> {
  const { start, end } = getMonthDateRange(monthKey);
  const where = { userId, date: { gte: start, lte: end } };

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
  ]);

  const income = roundMoney(incomeResult._sum.amount ?? 0);
  const expenses = roundMoney(expenseResult._sum.amount ?? 0);
  const savings = roundMoney(income - expenses);

  return {
    income,
    expenses,
    savings,
    savingsRate: computeSavingsRate(income, savings),
  };
}

export async function upsertNetWorthSnapshot(
  userId: string,
  monthKey: string,
  totalAssets: number,
  totalLiabilities: number
): Promise<void> {
  const totals = await getMonthTransactionTotals(userId, monthKey);
  const netWorth = roundMoney(totalAssets - totalLiabilities);

  await prisma.netWorthSnapshot.upsert({
    where: {
      userId_month: { userId, month: monthKey },
    },
    create: {
      userId,
      month: monthKey,
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyIncome: totals.income,
      monthlyExpenses: totals.expenses,
      monthlySavings: totals.savings,
      savingsRate: totals.savingsRate,
    },
    update: {
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyIncome: totals.income,
      monthlyExpenses: totals.expenses,
      monthlySavings: totals.savings,
      savingsRate: totals.savingsRate,
      recordedAt: new Date(),
    },
  });
}

function buildHistoryFromTransactions(
  transactions: Transaction[],
  currentNetWorth: number,
  currentAssets: number,
  currentLiabilities: number
): NetWorthHistoryPoint[] {
  const monthly = buildMonthlyIncomeExpenseData(transactions);
  if (monthly.length === 0) {
    const month = getCurrentMonthKey();
    return [
      {
        month,
        netWorth: currentNetWorth,
        totalAssets: currentAssets,
        totalLiabilities: currentLiabilities,
        savings: 0,
        savingsRate: null,
      },
    ];
  }

  const totalCumulativeSavings = monthly.reduce((sum, m) => sum + (m.income - m.expenses), 0);
  const assetBaseline = roundMoney(currentNetWorth - totalCumulativeSavings);

  let running = assetBaseline;
  return monthly.map((point) => {
    const savings = roundMoney(point.income - point.expenses);
    running = roundMoney(running + savings);
    return {
      month: point.month,
      netWorth: running,
      totalAssets: currentAssets,
      totalLiabilities: currentLiabilities,
      savings,
      savingsRate: computeSavingsRate(point.income, savings),
    };
  });
}

function mergeHistoryWithSnapshots(
  transactionHistory: NetWorthHistoryPoint[],
  snapshots: Array<{
    month: string;
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    monthlySavings: number;
    savingsRate: number | null;
  }>
): NetWorthHistoryPoint[] {
  const byMonth = new Map<string, NetWorthHistoryPoint>();

  for (const point of transactionHistory) {
    byMonth.set(point.month, point);
  }

  for (const snap of snapshots) {
    byMonth.set(snap.month, {
      month: snap.month,
      netWorth: roundMoney(snap.netWorth),
      totalAssets: roundMoney(snap.totalAssets),
      totalLiabilities: roundMoney(snap.totalLiabilities),
      savings: roundMoney(snap.monthlySavings),
      savingsRate: snap.savingsRate,
    });
  }

  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export async function getNetWorthDashboardData(
  userId: string
): Promise<NetWorthDashboardData> {
  assertDatabaseUrl();

  const currentMonth = getCurrentMonthKey();

  const [assets, liabilities, transactions, snapshots] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      orderBy: [{ value: "desc" }, { name: "asc" }],
    }),
    prisma.liability.findMany({
      where: { userId },
      orderBy: [{ value: "desc" }, { name: "asc" }],
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    }),
    prisma.netWorthSnapshot.findMany({
      where: { userId },
      orderBy: { month: "asc" },
    }),
  ]);

  const totalAssets = roundMoney(assets.reduce((sum, a) => sum + a.value, 0));
  const totalLiabilities = roundMoney(liabilities.reduce((sum, l) => sum + l.value, 0));
  const netWorth = roundMoney(totalAssets - totalLiabilities);

  await upsertNetWorthSnapshot(userId, currentMonth, totalAssets, totalLiabilities);

  const serializedTx = transactions.map(serializeTransaction);
  const transactionHistory = buildHistoryFromTransactions(
    serializedTx,
    netWorth,
    totalAssets,
    totalLiabilities
  );

  const refreshedSnapshots = await prisma.netWorthSnapshot.findMany({
    where: { userId },
    orderBy: { month: "asc" },
  });

  const history = mergeHistoryWithSnapshots(transactionHistory, refreshedSnapshots);
  const currentMonthTotals = await getMonthTransactionTotals(userId, currentMonth);

  const previousMonthPoint = history.length >= 2 ? history[history.length - 2] : null;
  const netWorthChange =
    previousMonthPoint !== null
      ? roundPercent(
          previousMonthPoint.netWorth === 0
            ? 0
            : ((netWorth - previousMonthPoint.netWorth) / Math.abs(previousMonthPoint.netWorth)) * 100
        )
      : null;

  return {
    current: {
      totalAssets,
      totalLiabilities,
      netWorth,
      savingsRate: currentMonthTotals.savingsRate,
      monthlyIncome: currentMonthTotals.income,
      monthlyExpenses: currentMonthTotals.expenses,
      monthlySavings: currentMonthTotals.savings,
      netWorthChangePercent: netWorthChange,
    },
    assets: assets.map(serializeAsset),
    liabilities: liabilities.map(serializeLiability),
    history,
  };
}

export async function listAssets(userId: string): Promise<Asset[]> {
  const rows = await prisma.asset.findMany({
    where: { userId },
    orderBy: [{ value: "desc" }, { name: "asc" }],
  });
  return rows.map(serializeAsset);
}

export async function listLiabilities(userId: string): Promise<Liability[]> {
  const rows = await prisma.liability.findMany({
    where: { userId },
    orderBy: [{ value: "desc" }, { name: "asc" }],
  });
  return rows.map(serializeLiability);
}
