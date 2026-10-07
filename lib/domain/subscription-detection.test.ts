import { describe, expect, it } from "vitest";
import {
  detectSubscriptions,
  merchantKey,
  type ExpenseCharge,
} from "@/lib/domain/subscription-detection";

const TODAY = new Date("2026-10-10T00:00:00Z");

function monthly(
  title: string,
  amounts: number[],
  { lastMonth = 10, day = 5, category = "Subscriptions" } = {}
): ExpenseCharge[] {
  // Charges on `day` of consecutive months, ending in `lastMonth` of 2026.
  return amounts.map((amount, index) => ({
    title,
    amount,
    category,
    date: new Date(Date.UTC(2026, lastMonth - amounts.length + index, day)),
  }));
}

describe("merchantKey", () => {
  it("ignores case, punctuation and reference numbers", () => {
    expect(merchantKey("NETFLIX.COM 866-579-7172")).toBe("netflix com");
    expect(merchantKey("Netflix.com #1234")).toBe("netflix com");
  });
});

describe("detectSubscriptions", () => {
  it("suggests tracking a regular monthly charge, starting at the next expected date", () => {
    const [suggestion] = detectSubscriptions(monthly("Spotify P1A2", [11.99, 11.99, 11.99, 11.99]), [], TODAY);

    expect(suggestion).toMatchObject({
      kind: "subscription",
      key: "subscription:spotify",
      frequency: "MONTHLY",
      amount: 11.99,
      chargeCount: 4,
      lastChargeDate: "2026-10-05",
      nextExpectedDate: "2026-11-05",
      priceChange: null,
    });
  });

  it("flags a recent price increase on an untracked subscription", () => {
    const [suggestion] = detectSubscriptions(
      monthly("NETFLIX.COM", [16.49, 16.49, 16.49, 18.99]),
      [],
      TODAY
    );

    expect(suggestion.kind).toBe("subscription");
    if (suggestion.kind === "subscription") {
      expect(suggestion.priceChange).toEqual({
        previousAmount: 16.49,
        newAmount: 18.99,
        changedOn: "2026-10-05",
      });
    }
  });

  it("offers to update a tracked recurring item that's still at the old price", () => {
    const suggestions = detectSubscriptions(
      monthly("NETFLIX.COM", [16.49, 16.49, 16.49, 18.99]),
      [{ id: "rec-1", title: "Netflix", amount: 16.49, frequency: "MONTHLY" }],
      TODAY
    );

    expect(suggestions).toEqual([
      expect.objectContaining({
        kind: "price_increase",
        key: "price:netflix com:1899",
        recurringId: "rec-1",
        recurringAmount: 16.49,
      }),
    ]);
  });

  it("does not suggest merchants that already have a recurring item", () => {
    const suggestions = detectSubscriptions(
      monthly("Spotify", [11.99, 11.99, 11.99]),
      [{ id: "rec-1", title: "Spotify Premium", amount: 11.99, frequency: "MONTHLY" }],
      TODAY
    );
    expect(suggestions).toEqual([]);
  });

  it("does not flag normal bill-to-bill variation as a price increase", () => {
    const [suggestion] = detectSubscriptions(
      monthly("Hydro One", [92.1, 104.3, 88.75, 99.2], { category: "Utilities" }),
      [],
      TODAY
    );
    expect(suggestion.kind).toBe("subscription");
    if (suggestion.kind === "subscription") expect(suggestion.priceChange).toBeNull();
  });

  it("ignores irregular spending at the same merchant", () => {
    const charges: ExpenseCharge[] = ["2026-07-02", "2026-07-09", "2026-08-30", "2026-10-01"].map(
      (date, index) => ({ title: "Starbucks", amount: 5 + index, category: "Food", date: new Date(date) })
    );
    expect(detectSubscriptions(charges, [], TODAY)).toEqual([]);
  });

  it("ignores subscriptions that have stopped charging", () => {
    const charges = monthly("Old Gym", [40, 40, 40, 40], { lastMonth: 6 });
    expect(detectSubscriptions(charges, [], TODAY)).toEqual([]);
  });

  it("needs three charges before calling something monthly", () => {
    expect(detectSubscriptions(monthly("Spotify", [11.99, 11.99]), [], TODAY)).toEqual([]);
  });

  it("detects weekly and yearly charges", () => {
    const weekly: ExpenseCharge[] = [0, 7, 14, 21].map((offset) => ({
      title: "Meal Kit",
      amount: 65,
      category: "Groceries",
      date: new Date(Date.UTC(2026, 8, 12 + offset)),
    }));
    const yearly: ExpenseCharge[] = [2025, 2026].map((year) => ({
      title: "Domain Renewal",
      amount: 20,
      category: "Subscriptions",
      date: new Date(Date.UTC(year, 8, 1)),
    }));

    const frequencies = detectSubscriptions([...weekly, ...yearly], [], TODAY).map((s) =>
      s.kind === "subscription" ? s.frequency : null
    );
    expect(frequencies.sort()).toEqual(["WEEKLY", "YEARLY"]);
  });
});
