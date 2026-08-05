import { describe, expect, it } from "vitest";
import { amountForTotals } from "@/lib/currency/amount";

describe("amountForTotals", () => {
  it("prefers baseAmount when present", () => {
    expect(amountForTotals({ amount: 100, baseAmount: 85 })).toBe(85);
  });

  it("falls back to amount when baseAmount is null/undefined", () => {
    expect(amountForTotals({ amount: 100, baseAmount: null as unknown as number })).toBe(100);
  });

  it("treats a zero baseAmount as a real value, not missing", () => {
    expect(amountForTotals({ amount: 100, baseAmount: 0 })).toBe(0);
  });
});
