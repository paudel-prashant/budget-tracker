export type {
  ForecastConfidence,
  ForecastEmptyState,
  ForecastEngine,
  ForecastEngineInput,
  ForecastEngineResult,
  ForecastInsight,
  ForecastInsightSeverity,
  ForecastPoint,
  ForecastTimeframe,
  RecurringForecastEvent,
  SpendingTrendMetrics,
} from "@/lib/forecasting/types";

export {
  FORECAST_TIMEFRAME_DAYS,
  isForecastTimeframe,
  roundMoney,
  toDateKey,
} from "@/lib/forecasting/types";

export { projectRecurringEvents, type RecurringSource } from "@/lib/forecasting/recurringProjection";
export {
  calculateSpendingTrends,
  type HistoricalTransaction,
} from "@/lib/forecasting/spendingTrendProjection";
export {
  buildHistoricalBalancePoints,
  projectBalance,
} from "@/lib/forecasting/balanceProjection";
export { generateForecastInsights } from "@/lib/forecasting/forecastInsights";
export {
  DefaultForecastEngine,
  defaultForecastEngine,
  runForecastEngine,
} from "@/lib/forecasting/forecastEngine";
