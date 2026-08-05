import { describe, expect, it } from "vitest";
import {
  computeBudgetHealth,
  computeBudgetProgress,
  computeRolloverAmount,
  getCurrentMonthYear,
  getMonthDateRange,
  getPreviousMonthYear,
  getProgressBarColor,
  getProgressBarValue,
  isValidMonthYear,
} from "@/lib/domain/budget-calculations";

describe("isValidMonthYear", () => {
  it("accepts valid month/year combinations", () => {
    expect(isValidMonthYear(1, 2000)).toBe(true);
    expect(isValidMonthYear(12, 2100)).toBe(true);
    expect(isValidMonthYear(6, 2026)).toBe(true);
  });

  it("rejects out-of-range months", () => {
    expect(isValidMonthYear(0, 2026)).toBe(false);
    expect(isValidMonthYear(13, 2026)).toBe(false);
  });

  it("rejects out-of-range years", () => {
    expect(isValidMonthYear(6, 1999)).toBe(false);
    expect(isValidMonthYear(6, 2101)).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(isValidMonthYear(1.5, 2026)).toBe(false);
    expect(isValidMonthYear(6, 2026.5)).toBe(false);
  });
});

describe("getCurrentMonthYear", () => {
  it("returns the current calendar month (1-indexed) and year", () => {
    const now = new Date();
    const result = getCurrentMonthYear();
    expect(result.month).toBe(now.getMonth() + 1);
    expect(result.year).toBe(now.getFullYear());
  });
});

describe("getMonthDateRange", () => {
  it("returns the first day of the month through the first day of the next month", () => {
    const { start, end } = getMonthDateRange(2, 2026);
    expect(start.toISOString()).toBe(new Date(2026, 1, 1).toISOString());
    expect(end.toISOString()).toBe(new Date(2026, 2, 1).toISOString());
  });

  it("rolls over into January of the next year for December", () => {
    const { end } = getMonthDateRange(12, 2026);
    expect(end.toISOString()).toBe(new Date(2027, 0, 1).toISOString());
  });
});

describe("computeBudgetProgress", () => {
  it("computes remaining and percentUsed under budget", () => {
    const result = computeBudgetProgress(200, 50);
    expect(result.remaining).toBe(150);
    expect(result.percentUsed).toBe(25);
    expect(result.isOverBudget).toBe(false);
    expect(result.isAtRisk).toBe(false);
  });

  it("flags at-risk once spending crosses the 80% threshold", () => {
    const result = computeBudgetProgress(100, 80);
    expect(result.percentUsed).toBe(80);
    expect(result.isAtRisk).toBe(true);
    expect(result.isOverBudget).toBe(false);
  });

  it("flags over-budget when spending exceeds the limit", () => {
    const result = computeBudgetProgress(100, 150);
    expect(result.isOverBudget).toBe(true);
    expect(result.isAtRisk).toBe(false);
    expect(result.remaining).toBe(-50);
  });

  it("treats a zero limit with spending as 100% used, not a division by zero", () => {
    const result = computeBudgetProgress(0, 20);
    expect(result.percentUsed).toBe(100);
    expect(Number.isFinite(result.percentUsed)).toBe(true);
  });

  it("treats a zero limit with no spending as 0% used", () => {
    const result = computeBudgetProgress(0, 0);
    expect(result.percentUsed).toBe(0);
    expect(result.isOverBudget).toBe(false);
  });
});

describe("computeBudgetHealth", () => {
  it("returns zeroed summary for an empty list", () => {
    const result = computeBudgetHealth([]);
    expect(result).toEqual({
      totalBudgets: 0,
      onTrack: 0,
      atRisk: 0,
      overBudget: 0,
      totalLimit: 0,
      totalSpent: 0,
      overallPercentUsed: 0,
    });
  });

  it("buckets budgets into onTrack/atRisk/overBudget correctly", () => {
    const result = computeBudgetHealth([
      { monthlyLimit: 100, spent: 20, isOverBudget: false, isAtRisk: false },
      { monthlyLimit: 100, spent: 85, isOverBudget: false, isAtRisk: true },
      { monthlyLimit: 100, spent: 120, isOverBudget: true, isAtRisk: false },
    ]);

    expect(result.totalBudgets).toBe(3);
    expect(result.onTrack).toBe(1);
    expect(result.atRisk).toBe(1);
    expect(result.overBudget).toBe(1);
    expect(result.totalLimit).toBe(300);
    expect(result.totalSpent).toBe(225);
    expect(result.overallPercentUsed).toBe(75);
  });
});

describe("getProgressBarColor", () => {
  it("returns error when over budget regardless of percent", () => {
    expect(getProgressBarColor(50, true)).toBe("error");
  });

  it("returns error at or above 100%", () => {
    expect(getProgressBarColor(100, false)).toBe("error");
  });

  it("returns warning at or above the at-risk threshold", () => {
    expect(getProgressBarColor(80, false)).toBe("warning");
  });

  it("returns success below the at-risk threshold", () => {
    expect(getProgressBarColor(79.9, false)).toBe("success");
  });
});

describe("getPreviousMonthYear", () => {
  it("returns the prior month within the same year", () => {
    expect(getPreviousMonthYear(6, 2026)).toEqual({ month: 5, year: 2026 });
  });

  it("rolls January back to December of the previous year", () => {
    expect(getPreviousMonthYear(1, 2026)).toEqual({ month: 12, year: 2025 });
  });
});

describe("computeRolloverAmount", () => {
  it("returns 0 when rollover is disabled, even with a previous budget", () => {
    expect(computeRolloverAmount({ monthlyLimit: 100, spent: 40 }, false)).toBe(0);
  });

  it("returns 0 when there is no previous budget, even when enabled", () => {
    expect(computeRolloverAmount(null, true)).toBe(0);
  });

  it("returns the unused amount as a positive carry-forward", () => {
    expect(computeRolloverAmount({ monthlyLimit: 100, spent: 40 }, true)).toBe(60);
  });

  it("returns a negative amount when the previous month was overspent", () => {
    expect(computeRolloverAmount({ monthlyLimit: 100, spent: 130 }, true)).toBe(-30);
  });

  it("rounds to 2 decimal places", () => {
    expect(computeRolloverAmount({ monthlyLimit: 100.005, spent: 33.333 }, true)).toBeCloseTo(66.67, 2);
  });
});

describe("getProgressBarValue", () => {
  it("clamps to [0, 100]", () => {
    expect(getProgressBarValue(-10)).toBe(0);
    expect(getProgressBarValue(150)).toBe(100);
    expect(getProgressBarValue(42)).toBe(42);
  });
});
