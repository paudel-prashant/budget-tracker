import { describe, expect, it } from "vitest";
import { findMatchingRule, mergeTags, type CategoryRuleLike } from "@/lib/domain/category-rules";
import { suggestCategory } from "@/lib/domain/category-suggestion-engine";

function rule(overrides: Partial<CategoryRuleLike>): CategoryRuleLike {
  return {
    id: overrides.pattern ?? "rule",
    pattern: "uber",
    matchType: "CONTAINS",
    type: "EXPENSE",
    category: "Transportation",
    tags: [],
    ...overrides,
  };
}

describe("findMatchingRule", () => {
  it("matches ignoring case and punctuation", () => {
    const match = findMatchingRule([rule({})], "UBER *TRIP 4F2X", "EXPENSE");
    expect(match?.category).toBe("Transportation");
  });

  it("prefers the longer pattern so specific rules beat general ones", () => {
    const rules = [rule({}), rule({ id: "eats", pattern: "uber eats", category: "Food & Beverages" })];
    expect(findMatchingRule(rules, "Uber Eats order", "EXPENSE")?.category).toBe("Food & Beverages");
    expect(findMatchingRule(rules, "Uber trip", "EXPENSE")?.category).toBe("Transportation");
  });

  it("prefers exact over starts-with over contains", () => {
    const rules = [
      rule({ id: "c", pattern: "amazon", matchType: "CONTAINS", category: "Shopping" }),
      rule({ id: "s", pattern: "amazon", matchType: "STARTS_WITH", category: "Household" }),
      rule({ id: "e", pattern: "amazon", matchType: "EXACT", category: "Gifts" }),
    ];
    expect(findMatchingRule(rules, "Amazon", "EXPENSE")?.id).toBe("e");
    expect(findMatchingRule(rules, "Amazon Marketplace", "EXPENSE")?.id).toBe("s");
    expect(findMatchingRule(rules, "Pay Amazon", "EXPENSE")?.id).toBe("c");
  });

  it("respects the rule's transaction type, and null applies to both", () => {
    expect(findMatchingRule([rule({})], "Uber refund", "INCOME")).toBeNull();
    expect(findMatchingRule([rule({ type: null })], "Uber refund", "INCOME")).not.toBeNull();
  });

  it("prefers a type-specific rule over an any-type rule with the same pattern", () => {
    const rules = [rule({ id: "any", type: null, category: "Misc" }), rule({ id: "exp" })];
    expect(findMatchingRule(rules, "uber", "EXPENSE")?.id).toBe("exp");
  });
});

describe("suggestCategory with rules", () => {
  it("lets a rule beat learned mappings and built-in keywords, carrying its tags", () => {
    const suggestion = suggestCategory(
      "Uber ride",
      "EXPENSE",
      [{ titleKey: "uber ride", category: "Travel", type: "EXPENSE" }],
      [rule({ tags: ["work"] })]
    );
    expect(suggestion).toEqual({
      category: "Transportation",
      source: "rule",
      matchedOn: "uber",
      tags: ["work"],
    });
  });
});

describe("mergeTags", () => {
  it("adds new tags once and caps the total at 10", () => {
    expect(mergeTags(["work"], ["work", "travel"])).toEqual(["work", "travel"]);
    const many = Array.from({ length: 12 }, (_, i) => `t${i}`);
    expect(mergeTags([], many)).toHaveLength(10);
  });
});
