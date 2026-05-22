import { formatMonth } from "@/lib/format";
import type {
  CategorySpendingInsight,
  DashboardInsightTone,
  DashboardInsights,
  MonthlyChartPoint,
  Summary,
  Transaction,
  TrendDirection,
} from "@/lib/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatMoneyPlain(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getTopExpenseCategory(
  transactions: Transaction[],
  totalExpenses: number
): CategorySpendingInsight | null {
  if (totalExpenses <= 0) return null;

  const byCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "EXPENSE") continue;
    byCategory.set(transaction.category, (byCategory.get(transaction.category) ?? 0) + transaction.amount);
  }

  let top: { category: string; amount: number } | null = null;

  for (const [category, amount] of byCategory) {
    if (!top || amount > top.amount) {
      top = { category, amount };
    }
  }

  if (!top) return null;

  return {
    category: top.category,
    amount: roundMoney(top.amount),
    percentOfTotal: roundPercent((top.amount / totalExpenses) * 100),
  };
}

function getSavingsTrend(monthly: MonthlyChartPoint[]): {
  direction: TrendDirection;
  changePercent: number | null;
  latestLabel: string | null;
  latestSavings: number | null;
} {
  if (monthly.length === 0) {
    return { direction: "flat", changePercent: null, latestLabel: null, latestSavings: null };
  }

  const latest = monthly[monthly.length - 1];
  const latestLabel = formatMonth(latest.month);
  const latestSavings = roundMoney(latest.income - latest.expenses);

  if (monthly.length < 2) {
    return { direction: "flat", changePercent: 0, latestLabel, latestSavings };
  }

  const previous = monthly[monthly.length - 2];
  const previousSavings = previous.income - previous.expenses;
  const currentSavings = latestSavings;

  if (previousSavings === 0) {
    return {
      direction: currentSavings > 0 ? "up" : currentSavings < 0 ? "down" : "flat",
      changePercent: currentSavings === 0 ? 0 : null,
      latestLabel,
      latestSavings,
    };
  }

  const changePercent = roundPercent(
    ((currentSavings - previousSavings) / Math.abs(previousSavings)) * 100
  );

  let direction: TrendDirection = "flat";
  if (Math.abs(changePercent) >= 0.5) {
    direction = changePercent > 0 ? "up" : "down";
  }

  return { direction, changePercent, latestLabel, latestSavings };
}

function buildHeadline(
  summary: Summary,
  topCategory: CategorySpendingInsight | null,
  savingsTrend: ReturnType<typeof getSavingsTrend>
): { headline: string; subline: string; tone: DashboardInsightTone } {
  const { totalIncome, totalExpenses, netBalance } = summary;

  if (netBalance < 0 && totalExpenses > 0) {
    return {
      headline: "Spending is ahead of income",
      subline: `Overall you're down ${formatMoneyPlain(Math.abs(netBalance))} after ${formatMoneyPlain(totalExpenses)} in expenses vs ${formatMoneyPlain(totalIncome)} in income.`,
      tone: "negative",
    };
  }

  if (topCategory && topCategory.percentOfTotal >= 35) {
    return {
      headline: `${topCategory.category} is your biggest expense driver`,
      subline: `About ${topCategory.percentOfTotal}% of spending (${formatMoneyPlain(topCategory.amount)}) goes to this category.`,
      tone: topCategory.percentOfTotal >= 50 ? "warning" : "neutral",
    };
  }

  if (
    savingsTrend.direction === "down" &&
    savingsTrend.changePercent !== null &&
    savingsTrend.changePercent <= -15 &&
    savingsTrend.latestLabel
  ) {
    return {
      headline: `Savings dipped in ${savingsTrend.latestLabel}`,
      subline: `Net savings fell ${Math.abs(savingsTrend.changePercent)}% compared with the previous month.`,
      tone: "warning",
    };
  }

  if (netBalance > 0) {
    return {
      headline: "You're net positive overall",
      subline: `Income exceeds expenses by ${formatMoneyPlain(netBalance)} across your tracked history.`,
      tone: "positive",
    };
  }

  if (savingsTrend.latestSavings !== null && savingsTrend.latestLabel) {
    const monthTone =
      savingsTrend.latestSavings >= 0 ? ("positive" as const) : ("negative" as const);
    return {
      headline:
        savingsTrend.latestSavings >= 0
          ? `${savingsTrend.latestLabel} ended in the green`
          : `${savingsTrend.latestLabel} spending exceeded income`,
      subline:
        savingsTrend.latestSavings >= 0
          ? `You saved about ${formatMoneyPlain(savingsTrend.latestSavings)} that month.`
          : `You were short about ${formatMoneyPlain(Math.abs(savingsTrend.latestSavings))} that month.`,
      tone: monthTone,
    };
  }

  return {
    headline: "Keep logging transactions for sharper insights",
    subline: "We'll highlight trends as your income and expense history grows.",
    tone: "neutral",
  };
}

export function buildDashboardInsights(
  transactions: Transaction[],
  summary: Summary,
  monthlyChartData: MonthlyChartPoint[]
): DashboardInsights | null {
  if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
    return null;
  }

  const topCategory = getTopExpenseCategory(transactions, summary.totalExpenses);
  const savingsTrend = getSavingsTrend(monthlyChartData);
  const { headline, subline, tone } = buildHeadline(summary, topCategory, savingsTrend);

  const incomeExpenseRatio =
    summary.totalExpenses > 0
      ? roundPercent((summary.totalIncome / summary.totalExpenses) * 100) / 100
      : null;

  return {
    headline,
    subline,
    tone,
    totalIncome: summary.totalIncome,
    totalExpenses: summary.totalExpenses,
    netBalance: summary.netBalance,
    topCategory,
    savingsTrendDirection: savingsTrend.direction,
    savingsTrendChangePercent: savingsTrend.changePercent,
    incomeExpenseRatio,
    latestMonthLabel: savingsTrend.latestLabel,
    latestMonthSavings: savingsTrend.latestSavings,
  };
}
