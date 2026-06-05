import { TransactionType } from "@prisma/client";
import type {
  ForecastEngineInput,
  ForecastEngineResult,
  ForecastInsight,
  ForecastInsightSeverity,
} from "@/lib/forecasting/types";
import { FORECAST_TIMEFRAME_DAYS, roundMoney } from "@/lib/forecasting/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function insight(
  id: string,
  message: string,
  severity: ForecastInsightSeverity = "info"
): ForecastInsight {
  return { id, message, severity };
}

export function generateForecastInsights(
  input: ForecastEngineInput,
  result: Pick<
    ForecastEngineResult,
    "projectedBalance" | "forecastChange" | "confidence" | "forecastPoints"
  >
): ForecastInsight[] {
  const insights: ForecastInsight[] = [];
  const { trends, recurringEvents, timeframe } = input;
  const days = FORECAST_TIMEFRAME_DAYS[timeframe];

  if (result.forecastChange > 0) {
    insights.push(
      insight(
        "balance-growth",
        `Current trends suggest your balance may grow by ${formatCurrency(result.forecastChange)} over the next ${days} days.`,
        "success"
      )
    );
  } else if (result.forecastChange < 0) {
    insights.push(
      insight(
        "balance-decline",
        `Spending patterns suggest your balance may decrease by ${formatCurrency(Math.abs(result.forecastChange))} over the next ${days} days.`,
        "warning"
      )
    );
  }

  if (trends.recurringExpenseShare >= 15) {
    insights.push(
      insight(
        "recurring-share",
        `Recurring subscriptions and bills account for about ${trends.recurringExpenseShare.toFixed(0)}% of recent expenses.`,
        trends.recurringExpenseShare >= 35 ? "warning" : "info"
      )
    );
  }

  if (trends.topVariableCategory) {
    insights.push(
      insight(
        "top-variable-category",
        `${trends.topVariableCategory} remains the largest variable expense category (${trends.topVariableCategoryShare.toFixed(0)}% of discretionary spending).`,
        "info"
      )
    );
  }

  const projectedPoints = result.forecastPoints.filter((point) => point.isProjected);
  const lowBalancePoint = projectedPoints.find((point) => point.balance < 500);

  if (lowBalancePoint && input.currentBalance >= 500) {
    const dayIndex = projectedPoints.indexOf(lowBalancePoint) + 1;
    insights.push(
      insight(
        "low-balance-warning",
        `Balance may fall below ${formatCurrency(500)} within ${dayIndex} days based on current projections.`,
        "warning"
      )
    );
  }

  const recurringIncome = recurringEvents.filter((event) => event.type === TransactionType.INCOME);
  if (recurringIncome.length > 0 && trends.averageDailyIncome > 0) {
    const monthlyRecurringIncome = recurringIncome.reduce((sum, event) => sum + event.amount, 0);
    if (result.forecastChange > 0 && monthlyRecurringIncome > 0) {
      insights.push(
        insight(
          "savings-trend",
          `Stable income and spending habits could add about ${formatCurrency(result.forecastChange)} to your balance this period.`,
          "success"
        )
      );
    }
  }

  if (trends.spendingVolatility > 40) {
    insights.push(
      insight(
        "volatile-spending",
        "Daily spending has been highly variable recently, which lowers forecast accuracy.",
        "warning"
      )
    );
  } else if (result.confidence === "HIGH") {
    insights.push(
      insight(
        "stable-patterns",
        "Your income and spending patterns are relatively stable, supporting a reliable forecast.",
        "success"
      )
    );
  }

  if (!input.hasRecurring && input.transactionCount > 0) {
    insights.push(
      insight(
        "no-recurring",
        "Add recurring transactions for salary, rent, and subscriptions to improve forecast accuracy.",
        "info"
      )
    );
  }

  return insights.slice(0, 6);
}
