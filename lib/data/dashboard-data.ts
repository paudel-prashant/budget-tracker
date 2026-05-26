import { connection } from "next/server";
import { getDashboardBudgetData } from "@/lib/data/budget-data";
import { getDashboardMetrics } from "@/lib/data/dashboard-metrics-data";
import { getNetWorthDashboardData } from "@/lib/data/net-worth-data";
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

  return {
    ...metrics,
    budgetHealth: budgetData.health,
    budgetWarnings: budgetData.warnings,
    netWorth,
  };
}
