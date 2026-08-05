import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/currency/exchange-rates", () => ({
  getExchangeRate: vi.fn(async () => 1.35),
}));

const { convertCurrency, resolveTransactionBaseAmount } = await import("@/lib/currency/convert");
const { getExchangeRate } = await import("@/lib/currency/exchange-rates");

describe("convertCurrency", () => {
  it("returns the rounded amount unchanged when currencies match, without calling the rate service", async () => {
    const result = await convertCurrency(42.567, "USD", "USD");
    expect(result).toBe(42.57);
    expect(getExchangeRate).not.toHaveBeenCalled();
  });

  it("applies the exchange rate and rounds to 2 decimals when currencies differ", async () => {
    const result = await convertCurrency(100, "USD", "CAD");
    expect(result).toBe(135);
    expect(getExchangeRate).toHaveBeenCalledWith("USD", "CAD", expect.any(Date));
  });
});

describe("resolveTransactionBaseAmount", () => {
  it("delegates to convertCurrency using the preferred currency as the target", async () => {
    const result = await resolveTransactionBaseAmount({
      amount: 10,
      currency: "USD",
      preferredCurrency: "CAD",
      date: new Date("2026-01-01"),
    });
    expect(result).toBe(13.5);
  });
});
