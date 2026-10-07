import { describe, expect, it } from "vitest";
import { TransactionType } from "@prisma/client";
import { validateTransactionBody } from "@/lib/validation/transaction-validation";

const validBody = {
  title: "Groceries",
  amount: 42.5,
  type: TransactionType.EXPENSE,
  category: "Food",
  date: "2026-01-15T00:00:00.000Z",
};

describe("validateTransactionBody", () => {
  it("accepts a valid transaction and trims strings", () => {
    const result = validateTransactionBody({ ...validBody, title: "  Groceries  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Groceries");
      expect(result.data.amount).toBe(42.5);
      expect(result.data.type).toBe(TransactionType.EXPENSE);
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it("rejects a non-object body", () => {
    expect(validateTransactionBody(null).success).toBe(false);
    expect(validateTransactionBody("nope").success).toBe(false);
  });

  it("rejects an empty or missing title", () => {
    expect(validateTransactionBody({ ...validBody, title: "" }).success).toBe(false);
    expect(validateTransactionBody({ ...validBody, title: "   " }).success).toBe(false);
    const noTitle: Record<string, unknown> = { ...validBody };
    delete noTitle.title;
    expect(validateTransactionBody(noTitle).success).toBe(false);
  });

  it("rejects a non-positive or non-finite amount", () => {
    expect(validateTransactionBody({ ...validBody, amount: 0 }).success).toBe(false);
    expect(validateTransactionBody({ ...validBody, amount: -5 }).success).toBe(false);
    expect(validateTransactionBody({ ...validBody, amount: Infinity }).success).toBe(false);
    expect(validateTransactionBody({ ...validBody, amount: "42" }).success).toBe(false);
  });

  it("rejects an invalid type", () => {
    expect(validateTransactionBody({ ...validBody, type: "TRANSFER" }).success).toBe(false);
  });

  it("rejects an empty category", () => {
    expect(validateTransactionBody({ ...validBody, category: "" }).success).toBe(false);
  });

  it("rejects an unparsable date", () => {
    expect(validateTransactionBody({ ...validBody, date: "not-a-date" }).success).toBe(false);
  });

  it("accepts a valid supported currency code", () => {
    const result = validateTransactionBody({ ...validBody, currency: "USD" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });

  it("rejects an unsupported currency code", () => {
    expect(validateTransactionBody({ ...validBody, currency: "XYZ" }).success).toBe(false);
  });

  it("rejects a supported code in the wrong case (currency matching is case-sensitive)", () => {
    expect(validateTransactionBody({ ...validBody, currency: "usd" }).success).toBe(false);
  });

  it("leaves currency undefined when not provided", () => {
    const result = validateTransactionBody(validBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBeUndefined();
    }
  });

  it("defaults tags to an empty array when omitted", () => {
    const result = validateTransactionBody(validBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("trims, lowercases, and de-duplicates tags", () => {
    const result = validateTransactionBody({ ...validBody, tags: ["  Work  ", "work", "Urgent"] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["work", "urgent"]);
    }
  });

  it("rejects a whitespace-only tag rather than silently dropping it", () => {
    const result = validateTransactionBody({ ...validBody, tags: ["work", "   "] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    expect(validateTransactionBody({ ...validBody, tags }).success).toBe(false);
  });

  it("rejects a tag over 30 characters", () => {
    expect(validateTransactionBody({ ...validBody, tags: ["a".repeat(31)] }).success).toBe(false);
  });

  it("accepts a tag at exactly 30 characters", () => {
    expect(validateTransactionBody({ ...validBody, tags: ["a".repeat(30)] }).success).toBe(true);
  });
});

describe("validateTransactionBody splits", () => {
  const splitBody = {
    ...validBody,
    amount: 160,
    splits: [
      { category: "Food", amount: 120.1 },
      { category: "Household", amount: 39.9 },
    ],
  };

  it("accepts parts that add up to the total (to the cent, despite float noise)", () => {
    const result = validateTransactionBody(splitBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.splits).toEqual(splitBody.splits);
    }
  });

  it("rejects parts that don't add up to the total", () => {
    const result = validateTransactionBody({ ...splitBody, amount: 161 });
    expect(result).toEqual({
      success: false,
      error: "split amounts must add up to the transaction amount",
    });
  });

  it("requires at least two parts", () => {
    const result = validateTransactionBody({
      ...validBody,
      splits: [{ category: "Food", amount: 42.5 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a part without a category", () => {
    const result = validateTransactionBody({
      ...splitBody,
      splits: [
        { category: " ", amount: 120.1 },
        { category: "Household", amount: 39.9 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("passes an explicit account through", () => {
    const result = validateTransactionBody({ ...validBody, financeAccountId: "acct-2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.financeAccountId).toBe("acct-2");
    }
  });
});
