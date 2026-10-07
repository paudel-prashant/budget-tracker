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
import type {
  Budget,
  BudgetHealth,
  BudgetHistoryMonth,
  BudgetWithProgress,
  CopyBudgetsResult,
} from "@/lib/types";

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
  await ensureBudgetCarryOver(userId);
  const { month, year } = getCurrentMonthYear();
  const health = await getBudgetHealthForMonth(userId, month, year);
  const warnings = health.budgets.filter((b) => b.isOverBudget);

  return { health, warnings };
}

/**
 * Every month the user has configured budgets for, newest first. This is the budget
 * "history" — budgets are stored per month, so past months are never lost and can be
 * reused as a template for a new month (see copyBudgetsToMonth).
 */
export async function getBudgetHistory(userId: string): Promise<BudgetHistoryMonth[]> {
  assertDatabaseUrl();

  const budgets = await prisma.budget.findMany({
    where: { userId },
    select: { category: true, monthlyLimit: true, month: true, year: true },
    orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }],
  });

  const history: BudgetHistoryMonth[] = [];

  for (const budget of budgets) {
    const last = history[history.length - 1];

    if (last && last.month === budget.month && last.year === budget.year) {
      last.budgetCount += 1;
      last.totalLimit = roundMoney(last.totalLimit + budget.monthlyLimit);
      last.categories.push(budget.category);
    } else {
      history.push({
        month: budget.month,
        year: budget.year,
        budgetCount: 1,
        totalLimit: roundMoney(budget.monthlyLimit),
        categories: [budget.category],
      });
    }
  }

  return history;
}

/**
 * Copies one month's budgets (limit + rollover setting) into another month. Categories
 * that already have a budget in the target month are left untouched, so this is safe to
 * run on a month that's partially set up.
 */
export async function copyBudgetsToMonth(
  userId: string,
  from: { month: number; year: number },
  to: { month: number; year: number }
): Promise<CopyBudgetsResult> {
  assertDatabaseUrl();

  const sourceBudgets = await prisma.budget.findMany({
    where: { userId, month: from.month, year: from.year },
    select: { category: true, monthlyLimit: true, rolloverEnabled: true },
  });

  if (sourceBudgets.length === 0) {
    return { created: 0, skipped: 0 };
  }

  const { count } = await prisma.budget.createMany({
    data: sourceBudgets.map((budget) => ({
      ...budget,
      month: to.month,
      year: to.year,
      userId,
    })),
    skipDuplicates: true,
  });

  return { created: count, skipped: sourceBudgets.length - count };
}

export function toMonthKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Starts the current month with the most recent earlier month's budgets, so users don't
 * have to recreate them every month. Runs at most once per user per month (tracked by
 * User.budgetCarryOverMonth): if the user later deletes a carried-over budget it stays
 * deleted, and a month they already set up themselves is never touched.
 *
 * Called lazily from the budget/dashboard reads and from the daily budget cron, like
 * processRecurringTransactions. Returns how many budgets were created.
 */
export async function ensureBudgetCarryOver(userId: string): Promise<number> {
  assertDatabaseUrl();

  const { month, year } = getCurrentMonthYear();
  const monthKey = toMonthKey(month, year);

  // Claim this month atomically first — of several concurrent callers only one gets
  // count === 1, so budgets are never copied twice. Also makes repeat calls one cheap query.
  const claimed = await prisma.user.updateMany({
    where: {
      id: userId,
      budgetCarryOverEnabled: true,
      OR: [{ budgetCarryOverMonth: null }, { budgetCarryOverMonth: { not: monthKey } }],
    },
    data: { budgetCarryOverMonth: monthKey },
  });

  if (claimed.count === 0) return 0;

  const existingCount = await prisma.budget.count({ where: { userId, month, year } });
  if (existingCount > 0) return 0;

  const source = await prisma.budget.findFirst({
    where: {
      userId,
      OR: [{ year: { lt: year } }, { year, month: { lt: month } }],
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { month: true, year: true },
  });

  if (!source) return 0;

  const { created } = await copyBudgetsToMonth(userId, source, { month, year });
  return created;
}
