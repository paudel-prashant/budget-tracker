import type {
  ForecastConfidence,
  ForecastEngine,
  ForecastEngineInput,
  ForecastEngineResult,
  ForecastEmptyState,
} from "@/lib/forecasting/types";
import {
  FORECAST_TIMEFRAME_DAYS,
  roundMoney,
} from "@/lib/forecasting/types";
import { projectBalance } from "@/lib/forecasting/balanceProjection";
import { generateForecastInsights } from "@/lib/forecasting/forecastInsights";

function calculateConfidence(input: ForecastEngineInput): ForecastConfidence {
  const { trends, hasRecurring, transactionCount } = input;

  if (transactionCount < 7 || trends.sampleDayCount < 5) {
    return "LOW";
  }

  const volatile = trends.spendingVolatility > 45;
  const stableIncome = hasRecurring && trends.averageDailyIncome > 0;
  const moderateVolatility = trends.spendingVolatility > 25;

  if (stableIncome && !volatile && transactionCount >= 20) {
    return "HIGH";
  }

  if (volatile || transactionCount < 14) {
    return "LOW";
  }

  if (moderateVolatility) {
    return "MEDIUM";
  }

  return "HIGH";
}

function detectEmptyStates(input: ForecastEngineInput): ForecastEmptyState[] {
  const states: ForecastEmptyState[] = [];

  if (input.transactionCount === 0) {
    states.push("no_history");
  } else if (input.transactionCount < 7) {
    states.push("insufficient_data");
  }

  if (!input.hasRecurring) {
    states.push("no_recurring");
  }

  return states;
}

export class DefaultForecastEngine implements ForecastEngine {
  run(input: ForecastEngineInput): ForecastEngineResult {
    const forecastDays = FORECAST_TIMEFRAME_DAYS[input.timeframe];
    const emptyStates = detectEmptyStates(input);
    const confidence = calculateConfidence(input);

    const forecastPoints = projectBalance({
      currentBalance: input.currentBalance,
      forecastDays,
      historicalPoints: input.historicalPoints,
      recurringEvents: input.recurringEvents,
      trends: input.trends,
    });

    const projectedBalance =
      forecastPoints.filter((point) => point.isProjected).at(-1)?.balance ??
      input.currentBalance;

    const forecastChange = roundMoney(projectedBalance - input.currentBalance);

    const baseResult = {
      timeframe: input.timeframe,
      currentBalance: roundMoney(input.currentBalance),
      projectedBalance: roundMoney(projectedBalance),
      forecastChange,
      confidence,
      forecastPoints,
      emptyStates,
      trends: input.trends,
      insights: [] as ForecastEngineResult["insights"],
    };

    return {
      ...baseResult,
      insights: generateForecastInsights(input, baseResult),
    };
  }
}

export const defaultForecastEngine = new DefaultForecastEngine();

export function runForecastEngine(input: ForecastEngineInput): ForecastEngineResult {
  return defaultForecastEngine.run(input);
}
