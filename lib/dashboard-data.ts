import { TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  buildBalanceOverTimeData,
  buildMonthlyIncomeExpenseData,
} from "@/lib/chart-data";
import type { DashboardData, Transaction } from "@/lib/types";

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

export async function getDashboardData(): Promise<DashboardData> {
  assertDatabaseUrl();

  const [transactions, incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { date: "asc" } }),
    prisma.transaction.aggregate({
      where: { type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
  ]);

  const serialized = transactions.map(serializeTransaction);
  const totalIncome = incomeResult._sum.amount ?? 0;
  const totalExpenses = expenseResult._sum.amount ?? 0;

  return {
    summary: {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    },
    balanceChartData: buildBalanceOverTimeData(serialized),
    monthlyChartData: buildMonthlyIncomeExpenseData(serialized),
  };
}
