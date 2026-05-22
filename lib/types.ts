export type TransactionType = "INCOME" | "EXPENSE";

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type RecurringTransaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  lastProcessedAt: string | null;
  createdAt: string;
};

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  createdAt: string;
};

export type Summary = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
};

export type BalanceChartPoint = {
  date: string;
  balance: number;
};

export type MonthlyChartPoint = {
  month: string;
  income: number;
  expenses: number;
};

export type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: string;
};

export type BudgetWithProgress = Budget & {
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isAtRisk: boolean;
};

export type BudgetHealth = {
  month: number;
  year: number;
  totalBudgets: number;
  onTrack: number;
  atRisk: number;
  overBudget: number;
  totalLimit: number;
  totalSpent: number;
  overallPercentUsed: number;
  budgets: BudgetWithProgress[];
};

export type TrendDirection = "up" | "down" | "flat";

export type CategorySpendingInsight = {
  category: string;
  amount: number;
  percentOfTotal: number;
};

export type MonthlySavingsPoint = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

export type SpendingSpike = {
  month: string;
  expenses: number;
  previousExpenses: number;
  changePercent: number;
};

export type ImportRowStatus = "valid" | "invalid" | "duplicate";

export type ImportPreviewRowResponse = {
  rowNumber: number;
  status: ImportRowStatus;
  errors: string[];
  data: {
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    importHash: string;
  } | null;
};

export type ImportPreviewResponse = {
  rows: ImportPreviewRowResponse[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
  };
};

export type FinancialInsights = {
  highestSpendingCategory: CategorySpendingInsight | null;
  monthlySavingsTrend: MonthlySavingsPoint[];
  savingsTrendDirection: TrendDirection;
  savingsTrendChangePercent: number | null;
  averageDailySpending: number;
  expenseDaysCount: number;
  incomeExpenseRatio: number | null;
  totalIncome: number;
  totalExpenses: number;
  mostExpensiveMonth: { month: string; expenses: number } | null;
  spendingSpikes: SpendingSpike[];
  categoryBreakdown: Array<{ category: string; amount: number }>;
};

export type DashboardData = {
  summary: Summary;
  balanceChartData: BalanceChartPoint[];
  monthlyChartData: MonthlyChartPoint[];
  budgetHealth: BudgetHealth;
  budgetWarnings: BudgetWithProgress[];
};
