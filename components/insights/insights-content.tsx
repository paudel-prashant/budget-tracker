"use client";

import { Box, Typography, useTheme } from "@mui/material";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { PageStack } from "@/components/shared/ui/page-stack";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { InsightCard } from "@/components/insights/insight-card";
import { SavingsTrendChart } from "@/components/insights/savings-trend-chart";
import { HeroBanner } from "@/components/shared/ui/viz/hero-banner";
import { MiniStat } from "@/components/shared/ui/viz/mini-stat";
import { RankedBars } from "@/components/shared/ui/viz/ranked-bars";
import { VizCard } from "@/components/shared/ui/viz/viz-card";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { SpendingSpikesPanel } from "@/components/insights/spending-spikes-panel";
import { formatCurrency, formatMonth, formatPercent } from "@/lib/utils/format";
import type { FinancialInsights } from "@/lib/types";

type InsightsContentProps = {
  insights: FinancialInsights;
};

function formatSavingsTrendLabel(
  changePercent: number | null,
  direction: FinancialInsights["savingsTrendDirection"]
): string | undefined {
  if (changePercent === null) {
    if (direction === "flat") return "Stable vs last month";
    return undefined;
  }
  const prefix = changePercent > 0 ? "+" : "";
  return `${prefix}${formatPercent(changePercent)} vs last month`;
}

/** A light-hearted read of the income/expense ratio. */
function moneyPersona(ratio: number | null): string {
  if (ratio === null) return "Log some expenses to meet your money persona";
  if (ratio >= 1.5) return "Persona: The Squirrel 🐿️ stashing plenty away";
  if (ratio >= 1.1) return "Persona: The Steady Saver 🐢 slow and sure";
  if (ratio >= 1) return "Persona: The Tightrope Walker 🎪 just about balanced";
  return "Persona: The Free Spirit 🎈 spending more than earning";
}

export function InsightsContent({ insights }: InsightsContentProps) {
  const hasData = insights.totalIncome > 0 || insights.totalExpenses > 0;
  const netPosition = insights.totalIncome - insights.totalExpenses;
  const theme = useTheme();

  const savingsTrendLabel = formatSavingsTrendLabel(
    insights.savingsTrendChangePercent,
    insights.savingsTrendDirection
  );

  return (
    <PageStack>
      <PageHeader
        title="Financial Insights"
        description="Data-driven analysis of your spending patterns, savings momentum, and financial health."
      />

      {!hasData && (
        <SurfaceCard sx={{ p: { xs: 4, sm: 5 }, textAlign: "center" }}>
          <InsightsOutlinedIcon sx={{ fontSize: 48, color: "primary.main", mb: 1.5, opacity: 0.9 }} />
          <Typography variant="h6" gutterBottom>
            Insights unlock with data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
            Add transactions to unlock personalized financial insights and charts.
          </Typography>
        </SurfaceCard>
      )}

      {hasData && (
        <HeroBanner
          eyebrow="Net position, all time"
          icon={AccountBalanceWalletOutlinedIcon}
          tone={netPosition >= 0 ? "success" : "error"}
          value={netPosition}
          format={formatCurrency}
          delta={
            savingsTrendLabel
              ? {
                  label: `Savings ${savingsTrendLabel}`,
                  direction: insights.savingsTrendDirection,
                  sentiment:
                    insights.savingsTrendDirection === "up"
                      ? "good"
                      : insights.savingsTrendDirection === "down"
                        ? "bad"
                        : "neutral",
                }
              : null
          }
          caption={moneyPersona(insights.incomeExpenseRatio)}
          trend={insights.monthlySavingsTrend.slice(-12).map((point) => point.savings)}
          trendLabel={
            insights.monthlySavingsTrend.length > 1 ? "Monthly savings, recent months" : undefined
          }
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            <MiniStat icon={TrendingUpOutlinedIcon} label="Total income" value={formatCurrency(insights.totalIncome)} color="success.main" />
            <MiniStat icon={TrendingDownOutlinedIcon} label="Total expenses" value={formatCurrency(insights.totalExpenses)} color="error.main" />
            <MiniStat
              icon={CompareArrowsOutlinedIcon}
              label="Earned per $1 spent"
              value={insights.incomeExpenseRatio !== null ? `${insights.incomeExpenseRatio.toFixed(2)}×` : "—"}
              color="primary.main"
            />
          </Box>
        </HeroBanner>
      )}

      <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 3 }}>
          <InsightCard
            title="Highest Spending Category"
            value={
              insights.highestSpendingCategory?.category ?? "—"
            }
            subtitle={
              insights.highestSpendingCategory
                ? `${formatCurrency(insights.highestSpendingCategory.amount)} · ${formatPercent(insights.highestSpendingCategory.percentOfTotal)} of expenses`
                : "No expense data yet"
            }
            icon={CategoryOutlinedIcon}
            iconColor="error.main"
          />
          <InsightCard
            title="Average Daily Spending"
            value={formatCurrency(insights.averageDailySpending)}
            subtitle={
              insights.expenseDaysCount > 0
                ? `Across ${insights.expenseDaysCount} day${insights.expenseDaysCount === 1 ? "" : "s"} with expenses`
                : "No expense days recorded"
            }
            icon={PaymentsOutlinedIcon}
            iconColor="warning.main"
          />
          <InsightCard
            title="Income vs Expense Ratio"
            value={
              insights.incomeExpenseRatio !== null
                ? `${insights.incomeExpenseRatio.toFixed(2)}×`
                : "—"
            }
            subtitle={
              insights.totalExpenses > 0
                ? `${formatCurrency(insights.totalIncome)} income · ${formatCurrency(insights.totalExpenses)} expenses`
                : "Requires expense data"
            }
            icon={CompareArrowsOutlinedIcon}
            iconColor={
              insights.incomeExpenseRatio !== null && insights.incomeExpenseRatio >= 1
                ? "success.main"
                : "error.main"
            }
            trend={
              insights.incomeExpenseRatio !== null && insights.incomeExpenseRatio >= 1
                ? "up"
                : insights.incomeExpenseRatio !== null
                  ? "down"
                  : "flat"
            }
            trendLabel={
              insights.incomeExpenseRatio !== null
                ? insights.incomeExpenseRatio >= 1
                  ? "Income covers expenses"
                  : "Spending exceeds income"
                : undefined
            }
            trendPositiveIsGood
          />
          <InsightCard
            title="Most Expensive Month"
            value={
              insights.mostExpensiveMonth
                ? formatMonth(insights.mostExpensiveMonth.month)
                : "—"
            }
            subtitle={
              insights.mostExpensiveMonth
                ? `${formatCurrency(insights.mostExpensiveMonth.expenses)} in expenses`
                : "No monthly expense data"
            }
            icon={CalendarMonthOutlinedIcon}
            iconColor="secondary.main"
          />
          <InsightCard
            title="Savings Trend"
            value={
              insights.monthlySavingsTrend.length > 0
                ? formatCurrency(
                    insights.monthlySavingsTrend[insights.monthlySavingsTrend.length - 1]
                      .savings
                  )
                : "—"
            }
            subtitle={
              insights.monthlySavingsTrend.length > 0
                ? "Latest month net savings"
                : "Need at least one month of data"
            }
            icon={SavingsOutlinedIcon}
            iconColor="primary.main"
            trend={insights.savingsTrendDirection}
            trendLabel={savingsTrendLabel}
            trendPositiveIsGood
          />
          <InsightCard
            title="Spending Spikes"
            value={String(insights.spendingSpikes.length)}
            subtitle={
              insights.spendingSpikes.length === 1
                ? "Month with 25%+ expense increase"
                : "Months with 25%+ expense increases"
            }
            icon={InsightsOutlinedIcon}
            iconColor={insights.spendingSpikes.length > 0 ? "warning.main" : "success.main"}
            trend={insights.spendingSpikes.length > 0 ? "up" : "flat"}
            trendLabel={
              insights.spendingSpikes.length > 0 ? "Review recommended" : "Spending stable"
            }
            trendPositiveIsGood={false}
          />
      </ResponsiveColumns>

      <ResponsiveColumns
        templateColumns={{ xs: "1fr", lg: "minmax(0, 2fr) minmax(0, 1fr)" }}
      >
        <SavingsTrendChart data={insights.monthlySavingsTrend} />
        <VizCard title="Spending by category" subtitle="All-time, top categories">
          <RankedBars
            format={formatCurrency}
            color={theme.palette.error.main}
            emptyMessage="No expense categories to chart yet."
            maxItems={7}
            items={insights.categoryBreakdown.map((row) => ({
              key: row.category,
              label: row.category,
              value: row.amount,
            }))}
          />
        </VizCard>
      </ResponsiveColumns>

      <SpendingSpikesPanel spikes={insights.spendingSpikes} />
    </PageStack>
  );
}
