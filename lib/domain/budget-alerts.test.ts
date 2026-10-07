import { describe, expect, it } from "vitest";
import { getBudgetAlertMessage, getCrossedAlertThresholds } from "@/lib/domain/budget-alerts";

describe("getCrossedAlertThresholds", () => {
  it("returns nothing below 80%", () => {
    expect(getCrossedAlertThresholds(79.9)).toEqual([]);
  });

  it("returns 80 once the at-risk threshold is reached", () => {
    expect(getCrossedAlertThresholds(80)).toEqual([80]);
  });

  it("only counts 100 once the budget is actually over (not exactly at the limit)", () => {
    expect(getCrossedAlertThresholds(100)).toEqual([80]);
    expect(getCrossedAlertThresholds(100.1)).toEqual([80, 100]);
  });
});

describe("getBudgetAlertMessage", () => {
  const budget = { category: "Food", spent: 425, effectiveLimit: 500, percentUsed: 85 };

  it("describes an at-risk budget with the amount left", () => {
    const message = getBudgetAlertMessage(budget, 80, "CAD");
    expect(message.title).toBe("Food budget at 85%");
    expect(message.body).toContain("75");
    expect(message.body).toContain("500");
  });

  it("describes an over-budget category", () => {
    const message = getBudgetAlertMessage({ ...budget, spent: 540, percentUsed: 108 }, 100, "CAD");
    expect(message.title).toBe("Food is over budget");
    expect(message.body).toContain("540");
  });
});
