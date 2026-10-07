import { formatCurrency } from "@/lib/utils/format";
import { BUDGET_AT_RISK_THRESHOLD } from "@/lib/domain/budget-calculations";

/** Percent-used levels that trigger a notification, lowest first. */
export const BUDGET_ALERT_THRESHOLDS = [BUDGET_AT_RISK_THRESHOLD, 100] as const;

/**
 * Thresholds a budget has reached. 100 counts only once the budget is actually *over*
 * (spent > limit), matching the "Over budget" state shown in the app.
 */
export function getCrossedAlertThresholds(percentUsed: number): number[] {
  return BUDGET_ALERT_THRESHOLDS.filter((threshold) =>
    threshold === 100 ? percentUsed > 100 : percentUsed >= threshold
  );
}

export function getBudgetAlertMessage(
  budget: { category: string; spent: number; effectiveLimit: number; percentUsed: number },
  threshold: number,
  currency: string
): { title: string; body: string } {
  const spent = formatCurrency(budget.spent, currency);
  const limit = formatCurrency(budget.effectiveLimit, currency);

  if (threshold >= 100) {
    return {
      title: `${budget.category} is over budget`,
      body: `You've spent ${spent} of your ${limit} limit this month.`,
    };
  }

  const left = formatCurrency(Math.max(budget.effectiveLimit - budget.spent, 0), currency);
  return {
    title: `${budget.category} budget at ${Math.round(budget.percentUsed)}%`,
    body: `${left} left of your ${limit} limit this month.`,
  };
}
