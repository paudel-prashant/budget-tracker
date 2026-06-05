import type { RecurrenceFrequency, TransactionType } from "@prisma/client";

export type ForecastTimeframe = "7d" | "30d" | "90d" | "180d";

export type ForecastConfidence = "HIGH" | "MEDIUM" | "LOW";

export type ForecastInsightSeverity = "info" | "success" | "warning";

export type ForecastEmptyState =
  | "no_history"
  | "insufficient_data"
  | "no_recurring";

export type ForecastPoint = {
  date: string;
  balance: number;
  isProjected: boolean;
  income?: number;
  expenses?: number;
};

export type ForecastInsight = {
  id: string;
  message: string;
  severity: ForecastInsightSeverity;
};

export type RecurringForecastEvent = {
  recurringId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  date: string;
};

export type SpendingTrendMetrics = {
  averageDailySpending: number;
  averageWeeklySpending: number;
  averageMonthlySpending: number;
  averageDailyIncome: number;
  spendingVolatility: number;
  sampleDayCount: number;
  topVariableCategory: string | null;
  topVariableCategoryShare: number;
  recurringExpenseShare: number;
};

export type ForecastEngineInput = {
  timeframe: ForecastTimeframe;
  currentBalance: number;
  currency: string;
  historicalPoints: ForecastPoint[];
  recurringEvents: RecurringForecastEvent[];
  trends: SpendingTrendMetrics;
  hasRecurring: boolean;
  transactionCount: number;
};

export type ForecastEngineResult = {
  timeframe: ForecastTimeframe;
  currentBalance: number;
  projectedBalance: number;
  forecastChange: number;
  confidence: ForecastConfidence;
  forecastPoints: ForecastPoint[];
  insights: ForecastInsight[];
  emptyStates: ForecastEmptyState[];
  trends: SpendingTrendMetrics;
};

export interface ForecastEngine {
  run(input: ForecastEngineInput): ForecastEngineResult;
}

export const FORECAST_TIMEFRAME_DAYS: Record<ForecastTimeframe, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
};

export function isForecastTimeframe(value: string): value is ForecastTimeframe {
  return value === "7d" || value === "30d" || value === "90d" || value === "180d";
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
