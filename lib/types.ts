export type TransactionType = "INCOME" | "EXPENSE";

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

export type DashboardData = {
  summary: Summary;
  balanceChartData: BalanceChartPoint[];
  monthlyChartData: MonthlyChartPoint[];
};
