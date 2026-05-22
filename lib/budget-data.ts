import { TransactionType } from "@prisma/client";
import {
  computeBudgetHealth,
  computeBudgetProgress,
  getCurrentMonthYear,
  getMonthDateRange,
} from "@/lib/budget-calculations";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { Budget, BudgetHealth, BudgetWithProgress } from "@/lib/types";

function serializeBudget(budget: {
  id: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: Date;
}): Budget {
  return {
    id: budget.id,
    category: budget.category,
    monthlyLimit: budget.monthlyLimit,
    month: budget.month,
    year: budget.year,
    createdAt: budget.createdAt.toISOString(),
  };
}

export async function getSpentByCategoryForMonth(
  userId: string,
  month: number,
  year: number
): Promise<Map<string, number>> {
  const { start, end } = getMonthDateRange(month, year);

  const grouped = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });

  const map = new Map<string, number>();
  for (const row of grouped) {
    map.set(row.category, row._sum.amount ?? 0);
  }
  return map;
}

export async function getBudgetsWithProgress(
  userId: string,
  month: number,
  year: number
): Promise<BudgetWithProgress[]> {
  assertDatabaseUrl();

  const [budgets, spentByCategory] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      orderBy: { category: "asc" },
    }),
    getSpentByCategoryForMonth(userId, month, year),
  ]);

  return budgets.map((budget) => {
    const spent = spentByCategory.get(budget.category) ?? 0;
    const progress = computeBudgetProgress(budget.monthlyLimit, spent);

    return {
      ...serializeBudget(budget),
      ...progress,
    };
  });
}

export async function getBudgetHealthForMonth(
  userId: string,
  month: number,
  year: number
): Promise<BudgetHealth> {
  const budgetsWithProgress = await getBudgetsWithProgress(userId, month, year);
  const summary = computeBudgetHealth(budgetsWithProgress);

  return {
    month,
    year,
    ...summary,
    budgets: budgetsWithProgress,
  };
}

export async function getDashboardBudgetData(userId: string): Promise<{
  health: BudgetHealth;
  warnings: BudgetWithProgress[];
}> {
  const { month, year } = getCurrentMonthYear();
  const health = await getBudgetHealthForMonth(userId, month, year);
  const warnings = health.budgets.filter((b) => b.isOverBudget);

  return { health, warnings };
}
