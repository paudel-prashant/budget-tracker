import type {
  AssistantAnalyticsSnapshot,
  AssistantInsight,
  AssistantIntent,
} from "@/lib/assistant/types";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

export function generateAssistantInsights(
  intent: AssistantIntent,
  data: AssistantAnalyticsSnapshot
): AssistantInsight[] {
  if (!data.hasTransactions) {
    return [
      {
        key: "no-data",
        title: "No transaction history",
        detail:
          "Add income and expense transactions so the assistant can analyze trends and categories.",
        severity: "info",
      },
    ];
  }

  switch (intent) {
    case "spending_trend":
      return insightsForSpendingTrend(data);
    case "category_increase":
      return insightsForCategoryIncrease(data);
    case "savings_advice":
      return insightsForSavingsAdvice(data);
    case "top_expenses":
      return insightsForTopExpenses(data);
    case "unusual_spending":
      return insightsForUnusualSpending(data);
    case "general_summary":
      return insightsForGeneralSummary(data);
    default:
      return insightsForGeneralSummary(data);
  }
}

function insightsForSpendingTrend(data: AssistantAnalyticsSnapshot): AssistantInsight[] {
  const insights: AssistantInsight[] = [];
  const change = data.expenseChangePercent;

  insights.push({
    key: "month-compare",
    title: `${data.currentMonthLabel} vs ${data.previousMonthLabel}`,
    detail: `You spent ${formatCurrency(data.current.expenses)} this month compared with ${formatCurrency(data.previous.expenses)} last month.`,
    severity: "info",
  });

  if (change !== null) {
    const direction = change > 0 ? "increased" : change < 0 ? "decreased" : "stayed flat";
    insights.push({
      key: "expense-change",
      title: "Expense change",
      detail: `Expenses ${direction} by ${formatPercent(Math.abs(change))} month over month.`,
      severity: change > 10 ? "warning" : change < -5 ? "positive" : "info",
    });
  }

  const topDriver = data.categoryComparisons.find((c) => c.changeAmount > 0);
  if (topDriver && topDriver.changeAmount > 0) {
    insights.push({
      key: "top-driver",
      title: "Largest category driver",
      detail: `${topDriver.category} added ${formatCurrency(topDriver.changeAmount)} versus last month.`,
      severity: "warning",
    });
  }

  if (data.incomeChangePercent !== null && Math.abs(data.incomeChangePercent) >= 5) {
    insights.push({
      key: "income-shift",
      title: "Income also shifted",
      detail: `Income is ${formatCurrency(data.current.income)} (${data.incomeChangePercent > 0 ? "up" : "down"} ${formatPercent(Math.abs(data.incomeChangePercent))} vs prior month), which affects how much room you have to spend.`,
      severity: "info",
    });
  }

  return insights;
}

function insightsForCategoryIncrease(data: AssistantAnalyticsSnapshot): AssistantInsight[] {
  const increased = data.categoryComparisons
    .filter((c) => c.changeAmount > 0)
    .sort((a, b) => b.changeAmount - a.changeAmount);

  if (increased.length === 0) {
    return [
      {
        key: "no-increase",
        title: "No category increases",
        detail: `No expense category spent more in ${data.currentMonthLabel} than in ${data.previousMonthLabel}.`,
        severity: "positive",
      },
    ];
  }

  const top = increased[0];
  const insights: AssistantInsight[] = [
    {
      key: "top-increase",
      title: "Biggest increase",
      detail: `${top.category} rose by ${formatCurrency(top.changeAmount)}${top.changePercent !== null ? ` (${formatPercent(top.changePercent)})` : ""}.`,
      severity: "warning",
    },
  ];

  const runners = increased.slice(1, 3);
  if (runners.length > 0) {
    insights.push({
      key: "other-increases",
      title: "Also higher",
      detail: runners
        .map((c) => `${c.category} (+${formatCurrency(c.changeAmount)})`)
        .join("; "),
      severity: "info",
    });
  }

  return insights;
}

function insightsForSavingsAdvice(data: AssistantAnalyticsSnapshot): AssistantInsight[] {
  const insights: AssistantInsight[] = [];
  const rate = data.current.savingsRate;

  insights.push({
    key: "current-savings",
    title: "This month's savings",
    detail: `Estimated savings: ${formatCurrency(data.current.savings)} on ${formatCurrency(data.current.income)} income${rate !== null ? ` (${formatPercent(rate)} savings rate)` : ""}.`,
    severity: data.current.savings >= 0 ? "positive" : "warning",
  });

  if (data.topExpenseCategories[0]) {
    const top = data.topExpenseCategories[0];
    insights.push({
      key: "trim-category",
      title: "Focus area",
      detail: `${top.category} is ${formatPercent(top.sharePercent)} of spending (${formatCurrency(top.amount)}). Review recurring charges and discretionary purchases there first.`,
      severity: "info",
    });
  }

  if (data.topBudgetRisks.length > 0) {
    insights.push({
      key: "budget-risk",
      title: "Budget pressure",
      detail: `${data.topBudgetRisks.map((b) => `${b.category} (${formatPercent(b.percentUsed)} used)`).join(", ")} — tightening these limits can protect savings.`,
      severity: "warning",
    });
  }

  if (data.averageDailySpend > 0) {
    insights.push({
      key: "daily-pace",
      title: "Daily spending pace",
      detail: `Average ${formatCurrency(data.averageDailySpend)} per active spending day. Pausing one discretionary day per week can add meaningful savings.`,
      severity: "info",
    });
  }

  return insights;
}

function insightsForTopExpenses(data: AssistantAnalyticsSnapshot): AssistantInsight[] {
  if (data.topExpenseCategories.length === 0) {
    return [
      {
        key: "no-expenses",
        title: "No expenses recorded",
        detail: `No expenses were logged for ${data.currentMonthLabel}.`,
        severity: "info",
      },
    ];
  }

  const top = data.topExpenseCategories[0];
  const insights: AssistantInsight[] = [
    {
      key: "top-category",
      title: "Highest category",
      detail: `${top.category} leads at ${formatCurrency(top.amount)} (${formatPercent(top.sharePercent)} of monthly expenses).`,
      severity: "warning",
    },
  ];

  const others = data.topExpenseCategories.slice(1, 4);
  if (others.length > 0) {
    insights.push({
      key: "top-list",
      title: "Also significant",
      detail: others
        .map((c) => `${c.category}: ${formatCurrency(c.amount)}`)
        .join(" · "),
      severity: "info",
    });
  }

  return insights;
}

function insightsForUnusualSpending(data: AssistantAnalyticsSnapshot): AssistantInsight[] {
  if (data.unusualExpenses.length === 0) {
    return [
      {
        key: "no-unusual",
        title: "Nothing unusual flagged",
        detail:
          "No standout large or atypical charges were detected this month based on your recent category patterns.",
        severity: "positive",
      },
    ];
  }

  return data.unusualExpenses.map((item, index) => ({
    key: `unusual-${index}`,
    title: item.title,
    detail: `${formatCurrency(item.amount)} in ${item.category} — ${item.reason}.`,
    severity: "warning",
  }));
}

function insightsForGeneralSummary(data: AssistantAnalyticsSnapshot): AssistantInsight[] {
  const insights: AssistantInsight[] = [
    {
      key: "snapshot",
      title: data.currentMonthLabel,
      detail: `Income ${formatCurrency(data.current.income)}, expenses ${formatCurrency(data.current.expenses)}, savings ${formatCurrency(data.current.savings)}.`,
      severity: data.current.savings >= 0 ? "positive" : "warning",
    },
  ];

  if (data.expenseChangePercent !== null) {
    insights.push({
      key: "expense-trend",
      title: "Spending trend",
      detail: `Expenses are ${data.expenseChangePercent >= 0 ? "up" : "down"} ${formatPercent(Math.abs(data.expenseChangePercent))} vs ${data.previousMonthLabel}.`,
      severity: data.expenseChangePercent > 10 ? "warning" : "info",
    });
  }

  if (data.topExpenseCategories[0]) {
    insights.push({
      key: "top-cat",
      title: "Top category",
      detail: `${data.topExpenseCategories[0].category} (${formatCurrency(data.topExpenseCategories[0].amount)}).`,
      severity: "info",
    });
  }

  return insights;
}
