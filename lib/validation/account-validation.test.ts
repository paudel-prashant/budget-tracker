import { describe, expect, it } from "vitest";
import { validateAccountBody, validateTransferBody } from "@/lib/validation/account-validation";

describe("validateAccountBody", () => {
  it("accepts a valid account, trims the name and defaults the opening balance", () => {
    const result = validateAccountBody({ name: "  Savings  ", type: "SAVINGS" });
    expect(result).toEqual({
      success: true,
      data: { name: "Savings", type: "SAVINGS", openingBalance: 0 },
    });
  });

  it("allows a negative opening balance (e.g. a credit card)", () => {
    const result = validateAccountBody({ name: "Visa", type: "CREDIT", openingBalance: -250 });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown account type", () => {
    expect(validateAccountBody({ name: "X", type: "BROKERAGE" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(validateAccountBody({ name: " ", type: "CASH" }).success).toBe(false);
  });
});

describe("validateTransferBody", () => {
  const valid = {
    fromAccountId: "a",
    toAccountId: "b",
    amount: 100.005,
    date: "2026-10-01T00:00:00.000Z",
  };

  it("accepts a valid transfer and rounds the amount to the cent", () => {
    const result = validateTransferBody(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(100.01);
      expect(result.data.note).toBeNull();
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it("rejects a transfer to the same account", () => {
    const result = validateTransferBody({ ...valid, toAccountId: "a" });
    expect(result).toEqual({ success: false, error: "Choose two different accounts" });
  });

  it("rejects a non-positive amount", () => {
    expect(validateTransferBody({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(validateTransferBody({ ...valid, date: "not-a-date" }).success).toBe(false);
  });
});
