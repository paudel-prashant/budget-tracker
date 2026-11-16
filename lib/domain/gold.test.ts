import { describe, expect, it } from "vitest";
import {
  fromGrams,
  goldHoldingValue,
  GRAMS_PER_TROY_OUNCE,
  isGoldCategory,
  purityLabel,
  toGrams,
} from "@/lib/domain/gold";

describe("gold math", () => {
  it("values one pure troy ounce at the ounce price", () => {
    expect(goldHoldingValue(GRAMS_PER_TROY_OUNCE, 1, 5500)).toBe(5500);
  });

  it("scales by purity", () => {
    expect(goldHoldingValue(GRAMS_PER_TROY_OUNCE, 0.75, 4000)).toBe(3000);
  });

  it("converts units round-trip", () => {
    expect(toGrams(1, "ozt")).toBeCloseTo(31.1035, 4);
    expect(toGrams(2, "kg")).toBe(2000);
    expect(fromGrams(toGrams(3.5, "tola"), "tola")).toBeCloseTo(3.5, 10);
  });

  it("recognizes the gold category case-insensitively", () => {
    expect(isGoldCategory(" gold ")).toBe(true);
    expect(isGoldCategory("Investments")).toBe(false);
    expect(isGoldCategory(null)).toBe(false);
  });

  it("labels known and custom purities", () => {
    expect(purityLabel(0.9167)).toBe("22K");
    expect(purityLabel(0.8)).toBe("80.00%");
  });
});
