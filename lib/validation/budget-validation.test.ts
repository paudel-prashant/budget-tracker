import { describe, expect, it } from "vitest";
import {
  parseMonthYearSearchParams,
  validateCreateBudgetBody,
} from "@/lib/validation/budget-validation";
import { getCurrentMonthYear } from "@/lib/domain/budget-calculations";

describe("validateCreateBudgetBody", () => {
  it("accepts a valid budget and trims category", () => {
    const result = validateCreateBudgetBody({
      category: "  Food  ",
      monthlyLimit: 300,
      month: 6,
      year: 2026,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Food");
      expect(result.data.month).toBe(6);
      expect(result.data.year).toBe(2026);
    }
  });

  it("defaults month/year to the current month when omitted", () => {
    const result = validateCreateBudgetBody({ category: "Food", monthlyLimit: 300 });
    const current = getCurrentMonthYear();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.month).toBe(current.month);
      expect(result.data.year).toBe(current.year);
    }
  });

  it("rejects a non-object body", () => {
    expect(validateCreateBudgetBody(null).success).toBe(false);
  });

  it("rejects an empty category", () => {
    expect(validateCreateBudgetBody({ category: "  ", monthlyLimit: 100 }).success).toBe(false);
  });

  it("rejects a non-positive monthlyLimit", () => {
    expect(validateCreateBudgetBody({ category: "Food", monthlyLimit: 0 }).success).toBe(false);
    expect(validateCreateBudgetBody({ category: "Food", monthlyLimit: -1 }).success).toBe(false);
  });

  it("rejects an out-of-range month or year", () => {
    expect(
      validateCreateBudgetBody({ category: "Food", monthlyLimit: 100, month: 13, year: 2026 })
        .success
    ).toBe(false);
    expect(
      validateCreateBudgetBody({ category: "Food", monthlyLimit: 100, month: 6, year: 1999 })
        .success
    ).toBe(false);
  });
});

describe("parseMonthYearSearchParams", () => {
  it("defaults to the current month/year when absent", () => {
    const result = parseMonthYearSearchParams(new URLSearchParams());
    const current = getCurrentMonthYear();
    expect(result).toEqual(current);
  });

  it("parses provided month/year strings", () => {
    const result = parseMonthYearSearchParams(new URLSearchParams("month=3&year=2025"));
    expect(result).toEqual({ month: 3, year: 2025 });
  });

  it("errors on non-numeric values", () => {
    const result = parseMonthYearSearchParams(new URLSearchParams("month=abc&year=2025"));
    expect("error" in result).toBe(true);
  });

  it("errors on out-of-range values", () => {
    const result = parseMonthYearSearchParams(new URLSearchParams("month=13&year=2025"));
    expect("error" in result).toBe(true);
  });
});
