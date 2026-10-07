import { describe, expect, it } from "vitest";
import { validateCategoryRuleBody } from "@/lib/validation/category-rule-validation";

describe("validateCategoryRuleBody", () => {
  it("normalizes the pattern and tags, defaulting to a contains match", () => {
    expect(
      validateCategoryRuleBody({ pattern: "  UBER*Trip ", category: "Transportation", tags: ["Work", "work"] })
    ).toEqual({
      success: true,
      data: {
        pattern: "uber trip",
        matchType: "CONTAINS",
        type: null,
        category: "Transportation",
        tags: ["work"],
      },
    });
  });

  it("keeps an explicit type and match type", () => {
    const result = validateCategoryRuleBody({
      pattern: "payroll",
      matchType: "STARTS_WITH",
      type: "INCOME",
      category: "Salary",
    });
    expect(result.success && result.data).toMatchObject({ matchType: "STARTS_WITH", type: "INCOME" });
  });

  it("rejects a pattern with no letters or numbers", () => {
    expect(validateCategoryRuleBody({ pattern: "***", category: "X" })).toEqual({
      success: false,
      error: "pattern must contain at least one letter or number",
    });
  });

  it("rejects a missing category and unknown match types", () => {
    expect(validateCategoryRuleBody({ pattern: "uber" }).success).toBe(false);
    expect(validateCategoryRuleBody({ pattern: "uber", category: "X", matchType: "REGEX" }).success).toBe(false);
  });
});
