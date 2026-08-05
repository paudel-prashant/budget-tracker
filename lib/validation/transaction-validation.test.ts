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
});
