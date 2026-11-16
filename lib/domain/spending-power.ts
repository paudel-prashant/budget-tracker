import type { BudgetWithProgress } from "@/lib/types";

export type SpendingMood = "over" | "fast" | "pace" | "ahead" | "closed" | "fresh";

export type SpendingPowerSummary = {
  totalLimit: number;
  spent: number;
  /** Negative when total spending exceeds the combined limits. */
  remaining: number;
  /** 0..1 share of the combined limit still available. */
  remainingFraction: number;
  /** Share that "should" be left if spending were spread evenly; null outside the current month. */
  paceFraction: number | null;
  /** Days left in the month including today (0 for past months). */
  daysLeft: number;
  dailyAllowance: number;
  mood: SpendingMood;
  headline: string;
  detail: string;
  /** Over-budget and at-risk categories, worst first (max 3). */
  watchList: BudgetWithProgress[];
};

function defaultMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("en-CA")}`;
}

export function summarizeSpendingPower(
  budgets: BudgetWithProgress[],
  month: number,
  year: number,
  now: Date = new Date(),
  /** Formats amounts in the headline/detail text (the UI passes the user's currency). */
  money: (value: number) => string = defaultMoney
): SpendingPowerSummary {
  const totalLimit = budgets.reduce((sum, b) => sum + Math.max(0, b.effectiveLimit), 0);
  const spent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = Math.round((totalLimit - spent) * 100) / 100;
  const remainingFraction = totalLimit > 0 ? Math.min(1, Math.max(0, remaining / totalLimit)) : 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const isCurrent = nowMonth === month && nowYear === year;
  const isPast = year < nowYear || (year === nowYear && month < nowMonth);

  const daysLeft = isCurrent ? daysInMonth - now.getDate() + 1 : isPast ? 0 : daysInMonth;
  // Elapsed days exclude today, so the 1st of the month starts with a full tank.
  const paceFraction = isCurrent ? 1 - (now.getDate() - 1) / daysInMonth : null;
  const dailyAllowance = daysLeft > 0 ? remaining / daysLeft : 0;

  let mood: SpendingMood;
  let headline: string;
  let detail: string;

  if (remaining < 0) {
    mood = "over";
    headline = isPast ? "This month went over budget" : "Over budget, time to tighten up";
    detail = `You've spent ${money(-remaining)} more than you budgeted across all categories.`;
  } else if (isPast) {
    mood = "closed";
    headline = remaining > 0 ? "Month closed under budget 🎉" : "Month closed right on budget";
    detail = `You finished with ${money(remaining)} of ${money(totalLimit)} unspent.`;
  } else if (!isCurrent) {
    mood = "fresh";
    headline = "Fresh month, full tank";
    detail = `${money(totalLimit)} budgeted across ${budgets.length} ${budgets.length === 1 ? "category" : "categories"}.`;
  } else {
    const lead = remainingFraction - (paceFraction ?? 0);
    const paceGap = Math.abs(lead) * totalLimit;
    if (lead >= 0.08) {
      mood = "ahead";
      headline = "Cruising, ahead of pace 🚀";
      detail = `You have ${money(paceGap)} more room than an even pace. About ${money(dailyAllowance)} a day for the next ${daysLeft} ${daysLeft === 1 ? "day" : "days"}.`;
    } else if (lead >= -0.05) {
      mood = "pace";
      headline = "Right on pace 👌";
      detail = `Keep it to about ${money(dailyAllowance)} a day for the next ${daysLeft} ${daysLeft === 1 ? "day" : "days"}.`;
    } else {
      mood = "fast";
      headline = "Spending a little fast 🐢";
      detail = `You're ${money(paceGap)} ahead of an even pace. Easing to ${money(dailyAllowance)} a day gets you to month-end on budget.`;
    }
  }

  const watchList = budgets
    .filter((b) => b.isOverBudget || b.isAtRisk)
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 3);

  return {
    totalLimit,
    spent,
    remaining,
    remainingFraction,
    paceFraction,
    daysLeft,
    dailyAllowance,
    mood,
    headline,
    detail,
    watchList,
  };
}
