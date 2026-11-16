import { describe, expect, it } from "vitest";
import { TransactionType } from "@prisma/client";
import {
  buildHistoricalBalancePoints,
  calculateSpendingTrends,
  projectBalance,
  runForecastEngine,
  type HistoricalTransaction,
} from "@/lib/forecasting";

const AS_OF = new Date("2026-11-16T12:00:00Z");
const DAY = 86_400_000;

function daysAgo(n: number): Date {
  return new Date(AS_OF.getTime() - n * DAY);
}

function expense(n: number, amount: number, extra: Partial<HistoricalTransaction> = {}): HistoricalTransaction {
  return { date: daysAgo(n), amount, type: TransactionType.EXPENSE, category: "Groceries", recurringTransactionId: null, ...extra };
}

function income(n: number, amount: number, extra: Partial<HistoricalTransaction> = {}): HistoricalTransaction {
  return { date: daysAgo(n), amount, type: TransactionType.INCOME, category: "Salary", recurringTransactionId: null, ...extra };
}

describe("calculateSpendingTrends", () => {
  it("averages over the history that exists, not the full 180-day window", () => {
    const txs = Array.from({ length: 10 }, (_, i) => expense(i, 50));
    const trends = calculateSpendingTrends(txs, [], AS_OF);
    expect(trends.historyDays).toBe(10);
    expect(trends.variableDailyExpense).toBeCloseTo(50, 0);
  });

  it("excludes recurring transactions from the variable trend (no double counting)", () => {
    const txs = [
      ...Array.from({ length: 60 }, (_, i) => expense(i, 30)),
      expense(5, 1500, { recurringTransactionId: "rent", category: "Rent" }),
      expense(35, 1500, { recurringTransactionId: "rent", category: "Rent" }),
    ];
    const trends = calculateSpendingTrends(txs, [], AS_OF);
    expect(trends.variableDailyExpense).toBeCloseTo(30, 0);
    expect(trends.averageDailySpending).toBeGreaterThan(70);
  });

  it("caps one-off spikes like a large gold purchase", () => {
    const txs = [...Array.from({ length: 90 }, (_, i) => expense(i, 40)), expense(3, 6000)];
    const trends = calculateSpendingTrends(txs, [], AS_OF);
    // Uncapped this would add ~6000/30*3/6 ≈ +100/day to the projection.
    expect(trends.variableDailyExpense).toBeLessThan(45);
    // ...but the displayed average still reflects real spending.
    expect(trends.averageDailySpending).toBeGreaterThan(80);
  });

  it("includes non-recurring income such as a manually logged paycheque", () => {
    const txs = [
      ...Array.from({ length: 90 }, (_, i) => expense(i, 40)),
      ...[0, 14, 28, 42, 56, 70, 84].map((n) => income(n, 2000)),
    ];
    const trends = calculateSpendingTrends(txs, [], AS_OF);
    expect(trends.variableDailyIncome).toBeGreaterThan(130);
  });
});

describe("projectBalance", () => {
  const baseTrends = calculateSpendingTrends(Array.from({ length: 60 }, (_, i) => expense(i, 20 + (i % 3) * 10)), [], AS_OF);

  it("projects from the real current balance and anchors history to it", () => {
    const history = buildHistoricalBalancePoints(
      Array.from({ length: 30 }, (_, i) => ({ date: daysAgo(i), amount: 25, type: TransactionType.EXPENSE })),
      30,
      AS_OF
    );
    const points = projectBalance({
      currentBalance: 5000,
      forecastDays: 10,
      historicalPoints: history,
      recurringEvents: [],
      trends: baseTrends,
      asOf: AS_OF,
    });
    const lastHistorical = points.filter((p) => !p.isProjected).at(-1)!;
    expect(lastHistorical.balance).toBe(5000);
    const firstProjected = points.find((p) => p.isProjected)!;
    expect(firstProjected.balance).toBeCloseTo(5000 - baseTrends.variableDailyExpense, 1);
  });

  it("widens the likely range over time", () => {
    const points = projectBalance({
      currentBalance: 1000,
      forecastDays: 30,
      historicalPoints: [],
      recurringEvents: [],
      trends: baseTrends,
      asOf: AS_OF,
    }).filter((p) => p.isProjected);
    const width = (p: (typeof points)[number]) => p.upper! - p.lower!;
    expect(width(points[29])).toBeGreaterThan(width(points[0]));
  });
});

describe("buildHistoricalBalancePoints", () => {
  it("starts the window at the pre-window balance, not the final one", () => {
    const points = buildHistoricalBalancePoints(
      [
        { date: daysAgo(100), amount: 1000, type: TransactionType.INCOME },
        { date: daysAgo(5), amount: 300, type: TransactionType.EXPENSE },
      ],
      30,
      AS_OF
    );
    expect(points[0].balance).toBe(1000);
    expect(points.at(-1)!.balance).toBe(700);
  });
});

describe("runForecastEngine", () => {
  it("reports a range and lowest point, and formats insights in the given currency", () => {
    const txs = Array.from({ length: 40 }, (_, i) => expense(i, 60));
    const trends = calculateSpendingTrends(txs, [], AS_OF);
    const result = runForecastEngine({
      timeframe: "30d",
      currentBalance: 1000,
      currency: "CAD",
      historicalPoints: [],
      recurringEvents: [],
      trends,
      hasRecurring: false,
      transactionCount: txs.length,
    });
    expect(result.projectedRange.low).toBeLessThanOrEqual(result.projectedBalance);
    expect(result.projectedRange.high).toBeGreaterThanOrEqual(result.projectedBalance);
    expect(result.lowestPoint?.balance).toBeLessThan(0);
    expect(result.insights[0].id).toBe("overdraft-warning");
    expect(result.insights.some((i) => i.message.includes("US$"))).toBe(false);
  });
});
