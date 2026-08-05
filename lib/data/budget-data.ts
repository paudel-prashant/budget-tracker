import { TransactionType } from "@prisma/client";
import {
  computeBudgetHealth,
  computeBudgetProgress,
  computeRolloverAmount,
  getCurrentMonthYear,
  getMonthDateRange,
  getPreviousMonthYear,
} from "@/lib/domain/budget-calculations";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import type { Budget, BudgetHealth, BudgetWithProgress } from "@/lib/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function serializeBudget(budget: {
  id: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
  rolloverEnabled: boolean;
  createdAt: Date;
}): Budget {
  return {
    id: budget.id,
    category: budget.category,
    monthlyLimit: budget.monthlyLimit,
    month: budget.month,
    year: budget.year,
    rolloverEnabled: budget.rolloverEnabled,
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
    _sum: { baseAmount: true },
  });

  const map = new Map<string, number>();
  for (const row of grouped) {
    map.set(row.category, row._sum.baseAmount ?? 0);
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

  // Only budgets with rollover enabled need last month's data — skip the extra
  // queries entirely when nobody's using it.
  const rolloverCategories = budgets.filter((b) => b.rolloverEnabled).map((b) => b.category);
  const previousByCategory = new Map<string, { monthlyLimit: number; spent: number }>();

  if (rolloverCategories.length > 0) {
    const previous = getPreviousMonthYear(month, year);
    const [previousBudgets, previousSpentByCategory] = await Promise.all([
      prisma.budget.findMany({
        where: {
          userId,
          month: previous.month,
          year: previous.year,
          category: { in: rolloverCategories },
        },
      }),
      getSpentByCategoryForMonth(userId, previous.month, previous.year),
    ]);

    for (const previousBudget of previousBudgets) {
      previousByCategory.set(previousBudget.category, {
        monthlyLimit: previousBudget.monthlyLimit,
        spent: previousSpentByCategory.get(previousBudget.category) ?? 0,
      });
    }
  }

  return budgets.map((budget) => {
    const spent = spentByCategory.get(budget.category) ?? 0;
    const previous = previousByCategory.get(budget.category) ?? null;
    const rolloverAmount = computeRolloverAmount(previous, budget.rolloverEnabled);
    const effectiveLimit = roundMoney(budget.monthlyLimit + rolloverAmount);
    const progress = computeBudgetProgress(effectiveLimit, spent);

    return {
      ...serializeBudget(budget),
      ...progress,
      rolloverAmount,
      effectiveLimit,
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
