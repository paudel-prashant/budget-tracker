import { describe, expect, it } from "vitest";
import {
  buildBudgetSuggestions,
  countLookbackMonths,
  roundUpBudgetLimit,
} from "@/lib/domain/budget-suggestions";

describe("countLookbackMonths", () => {
  it("uses up to 3 full months before the target", () => {
    expect(countLookbackMonths({ month: 10, year: 2026 }, new Date(2025, 0, 15))).toBe(3);
  });

  it("only counts months since the first transaction", () => {
    expect(countLookbackMonths({ month: 10, year: 2026 }, new Date(2026, 8, 20))).toBe(1);
    expect(countLookbackMonths({ month: 1, year: 2027 }, new Date(2026, 10, 3))).toBe(2);
  });

  it("is 0 with no history or history only in the target month", () => {
    expect(countLookbackMonths({ month: 10, year: 2026 }, null)).toBe(0);
    expect(countLookbackMonths({ month: 10, year: 2026 }, new Date(2026, 9, 2))).toBe(0);
  });
});

describe("roundUpBudgetLimit", () => {
  it("rounds up to a friendly step", () => {
    expect(roundUpBudgetLimit(41.2)).toBe(45);
    expect(roundUpBudgetLimit(412)).toBe(420);
    expect(roundUpBudgetLimit(1210)).toBe(1250);
    expect(roundUpBudgetLimit(400)).toBe(400);
  });
});

describe("buildBudgetSuggestions", () => {
  it("averages totals over the counted months, largest first", () => {
    const suggestions = buildBudgetSuggestions(
      new Map([
        ["Food", 1236],
        ["Fuel", 300],
        ["Refunds", 0],
      ]),
      3
    );
    expect(suggestions).toEqual([
      { category: "Food", averageMonthly: 412, monthsCounted: 3, suggestedLimit: 420 },
      { category: "Fuel", averageMonthly: 100, monthsCounted: 3, suggestedLimit: 100 },
    ]);
  });
});
