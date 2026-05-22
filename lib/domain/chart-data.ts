import type { BalanceChartPoint, MonthlyChartPoint, Transaction } from "@/lib/types";

function getDateKey(date: string): string {
  return date.slice(0, 10);
}

function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

export function buildBalanceOverTimeData(
  transactions: Transaction[]
): BalanceChartPoint[] {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const byDate = new Map<string, Transaction[]>();

  for (const transaction of sorted) {
    const dateKey = getDateKey(transaction.date);
    const existing = byDate.get(dateKey) ?? [];
    existing.push(transaction);
    byDate.set(dateKey, existing);
  }

  let runningBalance = 0;
  const points: BalanceChartPoint[] = [];

  for (const date of Array.from(byDate.keys()).sort()) {
    const dayTransactions = byDate.get(date) ?? [];

    for (const transaction of dayTransactions) {
      runningBalance +=
        transaction.type === "INCOME" ? transaction.amount : -transaction.amount;
    }

    points.push({ date, balance: runningBalance });
  }

  return points;
}

export function buildMonthlyIncomeExpenseData(
  transactions: Transaction[]
): MonthlyChartPoint[] {
  const grouped = new Map<string, MonthlyChartPoint>();

  for (const transaction of transactions) {
    const monthKey = getMonthKey(transaction.date);
    const existing = grouped.get(monthKey) ?? {
      month: monthKey,
      income: 0,
      expenses: 0,
    };

    if (transaction.type === "INCOME") {
      existing.income += transaction.amount;
    } else {
      existing.expenses += transaction.amount;
    }

    grouped.set(monthKey, existing);
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
}
