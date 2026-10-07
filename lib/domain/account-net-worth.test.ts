import { describe, expect, it } from "vitest";
import {
  accountNetWorthContribution,
  isLiquidAccountType,
  suggestAccountTypeForNetWorthItem,
  summarizeCreditCards,
  utilizationLevel,
} from "@/lib/domain/account-net-worth";

describe("accountNetWorthContribution", () => {
  it("counts a positive balance as an asset", () => {
    expect(accountNetWorthContribution(12500.5)).toEqual({ asset: 12500.5, liability: 0 });
  });

  it("counts a negative balance (card owing, overdraft) as a liability", () => {
    expect(accountNetWorthContribution(-640.25)).toEqual({ asset: 0, liability: 640.25 });
  });
});

describe("isLiquidAccountType", () => {
  it("treats investment accounts as not spendable", () => {
    expect(isLiquidAccountType("INVESTMENT")).toBe(false);
    expect(isLiquidAccountType("SAVINGS")).toBe(true);
    expect(isLiquidAccountType("CREDIT")).toBe(true);
  });
});

describe("suggestAccountTypeForNetWorthItem", () => {
  it("maps account-like categories and leaves the rest as manual items", () => {
    expect(suggestAccountTypeForNetWorthItem("asset", "Cash")).toBe("SAVINGS");
    expect(suggestAccountTypeForNetWorthItem("asset", "Investments")).toBe("INVESTMENT");
    expect(suggestAccountTypeForNetWorthItem("asset", "Retirement")).toBe("INVESTMENT");
    expect(suggestAccountTypeForNetWorthItem("asset", "Real Estate")).toBeNull();
    expect(suggestAccountTypeForNetWorthItem("liability", "Credit Card")).toBe("CREDIT");
    expect(suggestAccountTypeForNetWorthItem("liability", "Mortgage")).toBeNull();
  });
});

describe("utilizationLevel", () => {
  it("uses the 30% / 50% guidance", () => {
    expect(utilizationLevel(29.9)).toBe("good");
    expect(utilizationLevel(30)).toBe("fair");
    expect(utilizationLevel(50)).toBe("high");
  });
});

describe("summarizeCreditCards", () => {
  it("computes per-card and overall utilization, highest first", () => {
    const summary = summarizeCreditCards([
      { id: "visa", name: "Visa", currentBalance: -500, creditLimit: 5000 },
      { id: "amex", name: "Amex", currentBalance: -1800, creditLimit: 3000 },
    ]);

    expect(summary.cards.map((card) => [card.id, card.utilization, card.available])).toEqual([
      ["amex", 60, 1200],
      ["visa", 10, 4500],
    ]);
    expect(summary.totalOwed).toBe(2300);
    expect(summary.totalLimit).toBe(8000);
    expect(summary.overallUtilization).toBe(28.8);
  });

  it("leaves cards without a limit out of the overall figure", () => {
    const summary = summarizeCreditCards([
      { id: "visa", name: "Visa", currentBalance: -500, creditLimit: 1000 },
      { id: "store", name: "Store card", currentBalance: -300, creditLimit: null },
    ]);

    expect(summary.totalOwed).toBe(800);
    expect(summary.overallUtilization).toBe(50);
    expect(summary.cards.find((card) => card.id === "store")).toMatchObject({
      utilization: null,
      available: null,
    });
  });

  it("treats an overpaid card as owing nothing", () => {
    const [card] = summarizeCreditCards([
      { id: "visa", name: "Visa", currentBalance: 40, creditLimit: 1000 },
    ]).cards;
    expect(card).toMatchObject({ owed: 0, utilization: 0, available: 1000 });
  });

  it("has no overall utilization when no card has a limit", () => {
    expect(summarizeCreditCards([]).overallUtilization).toBeNull();
  });
});
