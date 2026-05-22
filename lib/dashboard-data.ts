import { connection } from "next/server";
import { TransactionType } from "@prisma/client";
import { getDashboardBudgetData } from "@/lib/budget-data";
import { processRecurringTransactions } from "@/lib/recurring-processor";
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

export async function getDashboardData(userId: string): Promise<DashboardData> {
  await connection();
  assertDatabaseUrl();

  await processRecurringTransactions(userId);

  const userWhere = { userId };

  const [transactions, incomeResult, expenseResult, budgetData] = await Promise.all([
    prisma.transaction.findMany({ where: userWhere, orderBy: { date: "asc" } }),
    prisma.transaction.aggregate({
      where: { ...userWhere, type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...userWhere, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    getDashboardBudgetData(userId),
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
    budgetHealth: budgetData.health,
    budgetWarnings: budgetData.warnings,
  };
}
