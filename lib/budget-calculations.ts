export const BUDGET_AT_RISK_THRESHOLD = 80;

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getMonthDateRange(month: number, year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}

export function isValidMonthYear(month: number, year: number): boolean {
  return (
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2100
  );
}

export type BudgetProgressMetrics = {
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isAtRisk: boolean;
};

export function computeBudgetProgress(
  monthlyLimit: number,
  spent: number
): BudgetProgressMetrics {
  const remaining = monthlyLimit - spent;
  const percentUsed =
    monthlyLimit > 0
      ? Math.round((spent / monthlyLimit) * 1000) / 10
      : spent > 0
        ? 100
        : 0;

  const isOverBudget = spent > monthlyLimit;
  const isAtRisk =
    !isOverBudget && percentUsed >= BUDGET_AT_RISK_THRESHOLD && monthlyLimit > 0;

  return {
    spent,
    remaining,
    percentUsed,
    isOverBudget,
    isAtRisk,
  };
}

export type BudgetHealthSummary = {
  totalBudgets: number;
  onTrack: number;
  atRisk: number;
  overBudget: number;
  totalLimit: number;
  totalSpent: number;
  overallPercentUsed: number;
};

export function computeBudgetHealth(
  items: Array<{ monthlyLimit: number; spent: number; isOverBudget: boolean; isAtRisk: boolean }>
): BudgetHealthSummary {
  if (items.length === 0) {
    return {
      totalBudgets: 0,
      onTrack: 0,
      atRisk: 0,
      overBudget: 0,
      totalLimit: 0,
      totalSpent: 0,
      overallPercentUsed: 0,
    };
  }

  let onTrack = 0;
  let atRisk = 0;
  let overBudget = 0;
  let totalLimit = 0;
  let totalSpent = 0;

  for (const item of items) {
    totalLimit += item.monthlyLimit;
    totalSpent += item.spent;

    if (item.isOverBudget) {
      overBudget += 1;
    } else if (item.isAtRisk) {
      atRisk += 1;
    } else {
      onTrack += 1;
    }
  }

  const overallPercentUsed =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 1000) / 10 : 0;

  return {
    totalBudgets: items.length,
    onTrack,
    atRisk,
    overBudget,
    totalLimit,
    totalSpent,
    overallPercentUsed,
  };
}

export function getProgressBarColor(
  percentUsed: number,
  isOverBudget: boolean
): "success" | "warning" | "error" {
  if (isOverBudget || percentUsed >= 100) return "error";
  if (percentUsed >= BUDGET_AT_RISK_THRESHOLD) return "warning";
  return "success";
}

export function getProgressBarValue(percentUsed: number): number {
  return Math.min(Math.max(percentUsed, 0), 100);
}
