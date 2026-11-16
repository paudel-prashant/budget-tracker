import { TransactionType } from "@prisma/client";
import type {
  ForecastEngineInput,
  ForecastEngineResult,
  ForecastInsight,
  ForecastInsightSeverity,
} from "@/lib/forecasting/types";
import { FORECAST_TIMEFRAME_DAYS } from "@/lib/forecasting/types";

const LOW_BALANCE_THRESHOLD = 500;

function currencyFormatter(currency: string) {
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    formatter = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 });
  }
  return (value: number) => formatter.format(value);
}

function formatDay(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
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
    "projectedBalance" | "forecastChange" | "confidence" | "forecastPoints" | "projectedRange"
  >
): ForecastInsight[] {
  // Most important first; the list is truncated at the end.
  const insights: ForecastInsight[] = [];
  const { trends, recurringEvents, timeframe } = input;
  const days = FORECAST_TIMEFRAME_DAYS[timeframe];
  const money = currencyFormatter(input.currency);
  const projectedPoints = result.forecastPoints.filter((point) => point.isProjected);

  const firstNegative = projectedPoints.find((point) => point.balance < 0);
  const lowBalancePoint = projectedPoints.find((point) => point.balance < LOW_BALANCE_THRESHOLD);

  if (firstNegative && input.currentBalance >= 0) {
    insights.push(
      insight(
        "overdraft-warning",
        `Your balance is projected to go negative around ${formatDay(firstNegative.date)}. Consider moving money or delaying a purchase before then.`,
        "warning"
      )
    );
  } else if (lowBalancePoint && input.currentBalance >= LOW_BALANCE_THRESHOLD) {
    insights.push(
      insight(
        "low-balance-warning",
        `Balance may fall below ${money(LOW_BALANCE_THRESHOLD)} around ${formatDay(lowBalancePoint.date)}.`,
        "warning"
      )
    );
  }

  if (result.forecastChange > 0) {
    insights.push(
      insight(
        "balance-growth",
        `Your balance is on track to grow by about ${money(result.forecastChange)} over the next ${days} days (likely ${money(result.projectedRange.low)}–${money(result.projectedRange.high)}).`,
        "success"
      )
    );
  } else if (result.forecastChange < 0) {
    insights.push(
      insight(
        "balance-decline",
        `Your balance may drop by about ${money(Math.abs(result.forecastChange))} over the next ${days} days (likely ${money(result.projectedRange.low)}–${money(result.projectedRange.high)}).`,
        "warning"
      )
    );
  }

  const biggestBill = recurringEvents
    .filter((event) => event.type === TransactionType.EXPENSE)
    .reduce<(typeof recurringEvents)[number] | null>(
      (max, event) => (!max || event.amount > max.amount ? event : max),
      null
    );
  if (biggestBill) {
    insights.push(
      insight(
        "largest-upcoming-bill",
        `Largest upcoming bill: ${biggestBill.title} (${money(biggestBill.amount)}) on ${formatDay(biggestBill.date)}.`,
        "info"
      )
    );
  }

  if (trends.recurringExpenseShare >= 15) {
    insights.push(
      insight(
        "recurring-share",
        `Recurring bills and subscriptions are about ${trends.recurringExpenseShare.toFixed(0)}% of recent expenses.`,
        trends.recurringExpenseShare >= 35 ? "warning" : "info"
      )
    );
  }

  if (trends.topVariableCategory) {
    insights.push(
      insight(
        "top-variable-category",
        `${trends.topVariableCategory} is your largest non-recurring expense category (${trends.topVariableCategoryShare.toFixed(0)}% of discretionary spending).`,
        "info"
      )
    );
  }

  if (trends.historyDays > 0 && trends.historyDays < 30) {
    insights.push(
      insight(
        "short-history",
        `This forecast is based on only ${trends.historyDays} day${trends.historyDays === 1 ? "" : "s"} of history, so it will sharpen as you log more transactions.`,
        "info"
      )
    );
  } else if (trends.spendingVolatility > 40) {
    insights.push(
      insight(
        "volatile-spending",
        "Daily spending has been highly variable recently, so the likely range is wide.",
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
