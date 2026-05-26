"use client";

import { Box } from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { InsightCard } from "@/components/insights/insight-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { StaggeredReveal } from "@/components/shared/ui/staggered-reveal";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { DashboardKpis } from "@/lib/types";

type DashboardKpiCardsProps = {
  kpis: DashboardKpis;
  dimmed?: boolean;
};

export function DashboardKpiCards({ kpis, dimmed = false }: DashboardKpiCardsProps) {
  const hasActivity =
    kpis.savingsRate !== null ||
    kpis.averageDailySpending > 0 ||
    kpis.largestExpenseCategory !== null;

  if (!hasActivity) {
    return null;
  }

  const cards = [
    <InsightCard
      key="savings-rate"
      title="Savings rate"
      value={kpis.savingsRate !== null ? formatPercent(kpis.savingsRate) : "—"}
      subtitle={
        kpis.savingsRate !== null
          ? "Income retained after expenses in this period"
          : "Add income to calculate savings rate"
      }
      icon={SavingsOutlinedIcon}
      tint="success"
      trend={kpis.savingsRateTrend.direction}
      trendLabel={kpis.savingsRateTrend.label}
      trendPositiveIsGood={kpis.savingsRateTrend.positiveIsGood}
    />,
    <InsightCard
      key="projected-spending"
      title="Projected monthly spending"
      value={formatCurrency(kpis.projectedMonthlySpending)}
      subtitle={`Based on ${kpis.rangeDayCount}-day period pace`}
      icon={TrendingUpOutlinedIcon}
      tint="warning"
      trend={kpis.projectedMonthlySpendingTrend.direction}
      trendLabel={kpis.projectedMonthlySpendingTrend.label}
      trendPositiveIsGood={kpis.projectedMonthlySpendingTrend.positiveIsGood}
    />,
    <InsightCard
      key="avg-daily"
      title="Average daily spending"
      value={formatCurrency(kpis.averageDailySpending)}
      subtitle={
        kpis.expenseDaysCount > 0
          ? `Across ${kpis.expenseDaysCount} day${kpis.expenseDaysCount === 1 ? "" : "s"} with expenses`
          : "No expense days in range"
      }
      icon={PaymentsOutlinedIcon}
      tint="warning"
      trend={kpis.averageDailySpendingTrend.direction}
      trendLabel={kpis.averageDailySpendingTrend.label}
      trendPositiveIsGood={kpis.averageDailySpendingTrend.positiveIsGood}
    />,
    <InsightCard
      key="top-category"
      title="Largest expense category"
      value={kpis.largestExpenseCategory?.category ?? "—"}
      subtitle={
        kpis.largestExpenseCategory
          ? `${formatCurrency(kpis.largestExpenseCategory.amount)} · ${formatPercent(kpis.largestExpenseCategory.percentOfTotal)} of expenses`
          : "No expenses in this period"
      }
      icon={CategoryOutlinedIcon}
      tint="error"
      trend={kpis.largestExpenseCategoryTrend.direction}
      trendLabel={kpis.largestExpenseCategoryTrend.label}
      trendPositiveIsGood={kpis.largestExpenseCategoryTrend.positiveIsGood}
    />,
    <InsightCard
      key="burn-rate"
      title="Monthly burn rate"
      value={formatCurrency(kpis.monthlyBurnRate)}
      subtitle="Expenses normalized to a 30-day month"
      icon={LocalFireDepartmentOutlinedIcon}
      tint="error"
      trend={kpis.monthlyBurnRateTrend.direction}
      trendLabel={kpis.monthlyBurnRateTrend.label}
      trendPositiveIsGood={kpis.monthlyBurnRateTrend.positiveIsGood}
    />,
  ];

  return (
    <Box
      sx={{
        opacity: dimmed ? 0.85 : 1,
        transition: "opacity 0.28s ease",
      }}
    >
      <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 3 }} gap={2}>
        <StaggeredReveal staggerMs={50}>{cards}</StaggeredReveal>
      </ResponsiveColumns>
    </Box>
  );
}
