import { describe, expect, it } from "vitest";
import { summarizeSpendingPower } from "@/lib/domain/spending-power";
import type { BudgetWithProgress } from "@/lib/types";

function budget(category: string, limit: number, spent: number): BudgetWithProgress {
  const percentUsed = (spent / limit) * 100;
  return {
    id: category,
    category,
    monthlyLimit: limit,
    month: 11,
    year: 2026,
    rolloverEnabled: false,
    createdAt: "2026-11-01T00:00:00.000Z",
    userId: "u",
    spent,
    remaining: limit - spent,
    percentUsed,
    isOverBudget: spent > limit,
    isAtRisk: percentUsed >= 80 && spent <= limit,
    rolloverAmount: 0,
    effectiveLimit: limit,
  } as unknown as BudgetWithProgress;
}

// Nov 16 → 15 of 30 days elapsed, so an even pace leaves 50%.
const MID_NOV = new Date(2026, 10, 16, 12);

describe("summarizeSpendingPower", () => {
  it("totals remaining and daily allowance for the current month", () => {
    const s = summarizeSpendingPower([budget("Groceries", 600, 200), budget("Fuel", 400, 100)], 11, 2026, MID_NOV);
    expect(s.totalLimit).toBe(1000);
    expect(s.remaining).toBe(700);
    expect(s.remainingFraction).toBeCloseTo(0.7, 5);
    expect(s.paceFraction).toBeCloseTo(0.5, 5);
    expect(s.daysLeft).toBe(15);
    expect(s.dailyAllowance).toBeCloseTo(46.67, 1);
    expect(s.mood).toBe("ahead");
  });

  it("flags spending faster than an even pace", () => {
    const s = summarizeSpendingPower([budget("Food & Beverages", 1000, 800)], 11, 2026, MID_NOV);
    expect(s.mood).toBe("fast");
    expect(s.watchList.length).toBe(1);
  });

  it("reports over budget with a negative remaining and an empty gauge", () => {
    const s = summarizeSpendingPower([budget("Entertainment", 100, 150)], 11, 2026, MID_NOV);
    expect(s.mood).toBe("over");
    expect(s.remaining).toBe(-50);
    expect(s.remainingFraction).toBe(0);
  });

  it("treats past and future months differently", () => {
    expect(summarizeSpendingPower([budget("Fuel", 100, 40)], 10, 2026, MID_NOV).mood).toBe("closed");
    const future = summarizeSpendingPower([budget("Fuel", 100, 0)], 12, 2026, MID_NOV);
    expect(future.mood).toBe("fresh");
    expect(future.paceFraction).toBeNull();
    expect(future.daysLeft).toBe(31);
  });
});
