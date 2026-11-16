import { describe, expect, it } from "vitest";
import { validateAssetBody, validateLiabilityBody } from "@/lib/validation/net-worth-validation";

const validAsset = {
  name: "Savings account",
  category: "Cash",
  amount: 1000,
  asOfDate: "2026-01-15",
};

describe("validateAssetBody", () => {
  it("accepts a valid asset", () => {
    const result = validateAssetBody(validAsset);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Savings account");
      expect(result.data.value).toBe(1000);
      expect(result.data.notes).toBeNull();
    }
  });

  it("accepts `value` as an alias for `amount`", () => {
    const { amount, ...rest } = validAsset;
    const result = validateAssetBody({ ...rest, value: amount });
    expect(result.success).toBe(true);
  });

  it("rounds value to 2 decimal places", () => {
    const result = validateAssetBody({ ...validAsset, amount: 10.005 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBeCloseTo(10.01, 2);
    }
  });

  it("rejects a missing name", () => {
    const rest: Record<string, unknown> = { ...validAsset };
    delete rest.name;
    expect(validateAssetBody(rest).success).toBe(false);
  });

  it("rejects a name over 120 characters", () => {
    expect(validateAssetBody({ ...validAsset, name: "a".repeat(121) }).success).toBe(false);
  });

  it("rejects a negative value", () => {
    expect(validateAssetBody({ ...validAsset, amount: -1 }).success).toBe(false);
  });

  it("allows a zero value", () => {
    expect(validateAssetBody({ ...validAsset, amount: 0 }).success).toBe(true);
  });

  it("rejects an unparsable asOfDate", () => {
    expect(validateAssetBody({ ...validAsset, asOfDate: "whenever" }).success).toBe(false);
  });

  it("normalizes category casing to the canonical value", () => {
    const result = validateAssetBody({ ...validAsset, category: "cash" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Cash");
    }
  });

  it("passes through an unrecognized category as-is (not restricted to the preset list)", () => {
    const result = validateAssetBody({ ...validAsset, category: "Crypto" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Crypto");
    }
  });

  it("trims notes and converts blank notes to null", () => {
    const result = validateAssetBody({ ...validAsset, notes: "  some notes  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("some notes");
    }

    const blank = validateAssetBody({ ...validAsset, notes: "   " });
    expect(blank.success).toBe(true);
    if (blank.success) {
      expect(blank.data.notes).toBeNull();
    }
  });
});

describe("validateLiabilityBody", () => {
  const validLiability = { ...validAsset, category: "Credit Card" };

  it("accepts a valid liability", () => {
    const result = validateLiabilityBody(validLiability);
    expect(result.success).toBe(true);
  });

  it("rejects a missing value", () => {
    const rest: Record<string, unknown> = { ...validLiability };
    delete rest.amount;
    expect(validateLiabilityBody(rest).success).toBe(false);
  });
});

describe("validateAssetBody — gold holdings", () => {
  const gold = { name: "Bullion", category: "gold", amount: 0, asOfDate: "2026-11-16" };

  it("requires a positive weight and a purity in (0, 1]", () => {
    expect(validateAssetBody(gold).success).toBe(false);
    expect(validateAssetBody({ ...gold, goldGrams: 10 }).success).toBe(false);
    expect(validateAssetBody({ ...gold, goldGrams: 10, goldPurity: 1.5 }).success).toBe(false);
  });

  it("accepts a valid holding and normalizes the category", () => {
    const result = validateAssetBody({ ...gold, goldGrams: "31.1", goldPurity: 0.9999, costBasis: 5400 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Gold");
      expect(result.data.goldGrams).toBe(31.1);
      expect(result.data.goldPurity).toBe(0.9999);
      expect(result.data.costBasis).toBe(5400);
    }
  });

  it("drops gold fields from non-gold assets", () => {
    const result = validateAssetBody({ ...validAsset, goldGrams: 10, goldPurity: 0.999 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goldGrams).toBeNull();
      expect(result.data.goldPurity).toBeNull();
    }
  });
});
