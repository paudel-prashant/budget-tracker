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

export type TransactionFilters = {
  search?: string;
  category?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
};

export type TransactionListPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type TransactionListResponse = {
  data: Transaction[];
  pagination: TransactionListPagination;
  meta: { categories: string[]; totalUnfiltered: number };
};

export type MonthlyReportCategoryRow = {
  category: string;
  amount: number;
  percentOfTotal: number;
  transactionCount: number;
};

export type MonthlyReportComparison = {
  previousMonth: string;
  previousMonthLabel: string;
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  savingsChangePercent: number | null;
};

export type MonthlyReportDailyPoint = {
  date: string;
  amount: number;
};

export type MonthlyReport = {
  month: string;
  monthLabel: string;
  monthLabelLong: string;
  generatedAt: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    savingsRate: number | null;
    transactionCount: number;
  };
  comparison: MonthlyReportComparison;
  topExpenseCategories: MonthlyReportCategoryRow[];
  topIncomeCategories: MonthlyReportCategoryRow[];
  charts: {
    incomeVsExpenses: { month: string; income: number; expenses: number };
    expenseByCategory: Array<{ category: string; amount: number }>;
    dailyExpenses: MonthlyReportDailyPoint[];
  };
};

export type MonthlyReportResponse = {
  report: MonthlyReport;
  availableMonths: string[];
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

export type DashboardInsightTone = "positive" | "negative" | "neutral" | "warning";

export type DashboardInsights = {
  headline: string;
  subline: string;
  tone: DashboardInsightTone;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  topCategory: CategorySpendingInsight | null;
  savingsTrendDirection: TrendDirection;
  savingsTrendChangePercent: number | null;
  incomeExpenseRatio: number | null;
  latestMonthLabel: string | null;
  latestMonthSavings: number | null;
};

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

export type Asset = {
  id: string;
  name: string;
  category: string;
  value: number;
  asOfDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Liability = {
  id: string;
  name: string;
  category: string;
  value: number;
  asOfDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NetWorthHistoryPoint = {
  month: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  savings: number;
  savingsRate: number | null;
};

export type NetWorthSummary = {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  savingsRate: number | null;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  netWorthChangePercent: number | null;
};

export type NetWorthDashboardData = {
  current: NetWorthSummary;
  assets: Asset[];
  liabilities: Liability[];
  history: NetWorthHistoryPoint[];
};

export type DashboardData = {
  summary: Summary;
  balanceChartData: BalanceChartPoint[];
  monthlyChartData: MonthlyChartPoint[];
  budgetHealth: BudgetHealth;
  budgetWarnings: BudgetWithProgress[];
  insights: DashboardInsights | null;
  netWorth: NetWorthDashboardData;
};
