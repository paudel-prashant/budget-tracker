export const BUDGET_SUGGESTION_LOOKBACK_MONTHS = 3;

export type BudgetSuggestion = {
  category: string;
  /** Average monthly spending over `monthsCounted` months. */
  averageMonthly: number;
  monthsCounted: number;
  /** averageMonthly rounded up to a friendly number — the suggested default limit. */
  suggestedLimit: number;
};

/**
 * How many of the lookback months to average over: never more than the lookback, and
 * never months before the user's first transaction (so a user who started last month
 * isn't told they "average" a third of what they spend).
 */
export function countLookbackMonths(
  target: { month: number; year: number },
  firstTransactionDate: Date | null,
  lookback: number = BUDGET_SUGGESTION_LOOKBACK_MONTHS
): number {
  if (!firstTransactionDate) return 0;

  const targetIndex = target.year * 12 + (target.month - 1);
  const firstIndex = firstTransactionDate.getFullYear() * 12 + firstTransactionDate.getMonth();
  const available = targetIndex - firstIndex;

  return Math.max(0, Math.min(lookback, available));
}

/** Rounds up to the nearest 5 under 100, 10 under 1,000, and 50 above. */
export function roundUpBudgetLimit(amount: number): number {
  if (amount <= 0) return 0;
  const step = amount < 100 ? 5 : amount < 1000 ? 10 : 50;
  return Math.ceil(amount / step) * step;
}

export function buildBudgetSuggestions(
  totalsByCategory: Map<string, number>,
  monthsCounted: number
): BudgetSuggestion[] {
  if (monthsCounted <= 0) return [];

  return [...totalsByCategory.entries()]
    .filter(([, total]) => total > 0)
    .map(([category, total]) => {
      const averageMonthly = Math.round((total / monthsCounted) * 100) / 100;
      return {
        category,
        averageMonthly,
        monthsCounted,
        suggestedLimit: roundUpBudgetLimit(averageMonthly),
      };
    })
    .sort((a, b) => b.averageMonthly - a.averageMonthly);
}
