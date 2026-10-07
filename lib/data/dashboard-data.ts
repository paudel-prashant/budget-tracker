import { connection } from "next/server";
import { getDashboardBudgetData } from "@/lib/data/budget-data";
import { getDashboardMetrics } from "@/lib/data/dashboard-metrics-data";
import { getNetWorthDashboardData } from "@/lib/data/net-worth-data";
import { getCreditCardSummary } from "@/lib/data/finance-account-data";
import { getDefaultDashboardDateRange } from "@/lib/domain/dashboard-date-range";
import type { DashboardData } from "@/lib/types";

export async function getDashboardData(userId: string): Promise<DashboardData> {
  await connection();

  const defaultRange = getDefaultDashboardDateRange();

  const [metrics, budgetData, netWorth] = await Promise.all([
    getDashboardMetrics(userId, defaultRange),
    getDashboardBudgetData(userId),
    getNetWorthDashboardData(userId),
  ]);

  // After the net worth load, which syncs account balances.
  const creditCards = await getCreditCardSummary(userId);

  return {
    ...metrics,
    creditCards,
    budgetHealth: budgetData.health,
    budgetWarnings: budgetData.warnings,
    netWorth,
  };
}
