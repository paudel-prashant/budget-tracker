import { describe, expect, it } from "vitest";
import { computeAccountBalance } from "@/lib/domain/account-balance";

describe("computeAccountBalance", () => {
  it("adds income and transfers in, subtracts expenses and transfers out", () => {
    expect(
      computeAccountBalance({
        openingBalance: 1000,
        income: 2500,
        expenses: 1800.5,
        transfersIn: 200,
        transfersOut: 500,
      })
    ).toBe(1399.5);
  });

  it("supports negative balances such as a credit card", () => {
    expect(
      computeAccountBalance({
        openingBalance: -300,
        income: 0,
        expenses: 120,
        transfersIn: 300,
        transfersOut: 0,
      })
    ).toBe(-120);
  });

  it("rounds away floating-point noise to the cent", () => {
    expect(
      computeAccountBalance({
        openingBalance: 0,
        income: 0.1,
        expenses: 0,
        transfersIn: 0.2,
        transfersOut: 0,
      })
    ).toBe(0.3);
  });
});
