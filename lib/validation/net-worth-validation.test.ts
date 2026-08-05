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
