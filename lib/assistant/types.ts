export type AssistantIntent =
  | "spending_trend"
  | "category_increase"
  | "savings_advice"
  | "top_expenses"
  | "unusual_spending"
  | "general_summary"
  | "unknown";

export type MonthTotals = {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number | null;
};

export type CategoryMonthComparison = {
  category: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changePercent: number | null;
};

export type MonthlyTrendPoint = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

export type UnusualExpenseItem = {
  title: string;
  category: string;
  amount: number;
  date: string;
  reason: string;
};

export type AssistantAnalyticsSnapshot = {
  currentMonth: string;
  previousMonth: string;
  currentMonthLabel: string;
  previousMonthLabel: string;
  hasTransactions: boolean;
  transactionCount: number;
  lifetime: MonthTotals;
  current: MonthTotals;
  previous: MonthTotals;
  expenseChangePercent: number | null;
  incomeChangePercent: number | null;
  monthlyTrend: MonthlyTrendPoint[];
  categoryComparisons: CategoryMonthComparison[];
  topExpenseCategories: Array<{ category: string; amount: number; sharePercent: number }>;
  unusualExpenses: UnusualExpenseItem[];
  averageDailySpend: number;
  topBudgetRisks: Array<{ category: string; percentUsed: number }>;
};

export type AssistantInsight = {
  key: string;
  title: string;
  detail: string;
  severity?: "info" | "positive" | "warning";
};

export type AssistantReply = {
  message: string;
  intent: AssistantIntent;
  insights: AssistantInsight[];
  suggestedQuestions: string[];
  provider: "rule-based" | "groq";
};

export type AssistantRequest = {
  message: string;
};
