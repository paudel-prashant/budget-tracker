import dayjs from "dayjs";
import type {
  CategorySpendingInsight,
  DashboardKpis,
  KpiTrendComparison,
  Summary,
  TrendDirection,
} from "@/lib/types";
import type { ResolvedDashboardDateRange } from "@/lib/domain/dashboard-date-range";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeSavingsRate(income: number, expenses: number): number | null {
  if (income <= 0) {
    return null;
  }
  return roundPercent(((income - expenses) / income) * 100);
}

export function getInclusiveRangeDayCount(range: ResolvedDashboardDateRange): number {
  const start = dayjs(range.dateFrom).startOf("day");
  const end = dayjs(range.dateTo).startOf("day");
  return Math.max(1, end.diff(start, "day") + 1);
}

export function getElapsedDaysInRange(range: ResolvedDashboardDateRange): number {
  const start = dayjs(range.dateFrom).startOf("day");
  const end = dayjs(range.dateTo).endOf("day");
  const today = dayjs().endOf("day");

  if (today.isBefore(start)) {
    return 0;
  }

  const effectiveEnd = today.isBefore(end) ? today : end;
  return Math.max(1, effectiveEnd.startOf("day").diff(start, "day") + 1);
}

function getTrendDirection(changePercent: number | null): TrendDirection {
  if (changePercent === null || Math.abs(changePercent) < 0.5) {
    return "flat";
  }
  return changePercent > 0 ? "up" : "down";
}

export function buildKpiTrendComparison(
  current: number,
  previous: number,
  options: { positiveIsGood: boolean; unit?: "percent" | "money" }
): KpiTrendComparison {
  const { positiveIsGood, unit = "percent" } = options;

  if (previous === 0 && current === 0) {
    return {
      direction: "flat",
      changePercent: 0,
      label: "No change vs prior period",
      positiveIsGood,
    };
  }

  if (previous === 0) {
    return {
      direction: current > 0 ? "up" : "flat",
      changePercent: null,
      label: "No prior period data",
      positiveIsGood,
    };
  }

  const changePercent = roundPercent(((current - previous) / Math.abs(previous)) * 100);
  const direction = getTrendDirection(changePercent);
  const prefix = changePercent > 0 ? "+" : "";

  const label =
    unit === "money"
      ? `${prefix}${changePercent}% vs prior period`
      : `${prefix}${changePercent}% vs prior period`;

  return {
    direction,
    changePercent,
    label,
    positiveIsGood,
  };
}

export function buildSavingsRateTrend(
  currentRate: number | null,
  previousRate: number | null
): KpiTrendComparison {
  if (currentRate === null || previousRate === null) {
    return {
      direction: "flat",
      changePercent: null,
      label: "Needs income in both periods",
      positiveIsGood: true,
    };
  }

  return buildKpiTrendComparison(currentRate, previousRate, { positiveIsGood: true });
}

type BuildDashboardKpisInput = {
  summary: Summary;
  previousSummary: Summary;
  topCategory: CategorySpendingInsight | null;
  previousTopCategoryAmount: number;
  expenseDaysCount: number;
  previousExpenseDaysCount: number;
  range: ResolvedDashboardDateRange;
};

export function buildDashboardKpis(input: BuildDashboardKpisInput): DashboardKpis {
  const {
    summary,
    previousSummary,
    topCategory,
    previousTopCategoryAmount,
    expenseDaysCount,
    previousExpenseDaysCount,
    range,
  } = input;

  const rangeDayCount = getInclusiveRangeDayCount(range);
  const elapsedDays = getElapsedDaysInRange(range);
  const projectionDays = dayjs(range.dateTo).daysInMonth();

  const savingsRate = computeSavingsRate(summary.totalIncome, summary.totalExpenses);
  const previousSavingsRate = computeSavingsRate(
    previousSummary.totalIncome,
    previousSummary.totalExpenses
  );

  const averageDailySpending =
    expenseDaysCount > 0
      ? roundMoney(summary.totalExpenses / expenseDaysCount)
      : 0;

  const previousAverageDailySpending =
    previousExpenseDaysCount > 0
      ? roundMoney(previousSummary.totalExpenses / previousExpenseDaysCount)
      : 0;

  const monthlyBurnRate =
    rangeDayCount > 0
      ? roundMoney(summary.totalExpenses * (30.437 / rangeDayCount))
      : 0;

  const previousMonthlyBurnRate =
    rangeDayCount > 0
      ? roundMoney(previousSummary.totalExpenses * (30.437 / rangeDayCount))
      : 0;

  const projectedMonthlySpending =
    elapsedDays > 0
      ? roundMoney((summary.totalExpenses / elapsedDays) * projectionDays)
      : 0;

  const previousProjectedMonthlySpending =
    elapsedDays > 0
      ? roundMoney((previousSummary.totalExpenses / elapsedDays) * projectionDays)
      : 0;

  const topCategoryAmount = topCategory?.amount ?? 0;

  return {
    savingsRate,
    savingsRateTrend: buildSavingsRateTrend(savingsRate, previousSavingsRate),
    projectedMonthlySpending,
    projectedMonthlySpendingTrend: buildKpiTrendComparison(
      projectedMonthlySpending,
      previousProjectedMonthlySpending,
      { positiveIsGood: false }
    ),
    averageDailySpending,
    averageDailySpendingTrend: buildKpiTrendComparison(
      averageDailySpending,
      previousAverageDailySpending,
      { positiveIsGood: false }
    ),
    largestExpenseCategory: topCategory,
    largestExpenseCategoryTrend: buildKpiTrendComparison(
      topCategoryAmount,
      previousTopCategoryAmount,
      { positiveIsGood: false }
    ),
    monthlyBurnRate,
    monthlyBurnRateTrend: buildKpiTrendComparison(
      monthlyBurnRate,
      previousMonthlyBurnRate,
      { positiveIsGood: false }
    ),
    expenseDaysCount,
    rangeDayCount,
  };
}
