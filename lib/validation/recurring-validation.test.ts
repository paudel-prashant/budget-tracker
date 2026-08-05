import { describe, expect, it } from "vitest";
import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { validateCreateRecurringTransactionBody } from "@/lib/validation/recurring-validation";

const validBody = {
  title: "Rent",
  amount: 1500,
  type: TransactionType.EXPENSE,
  category: "Housing",
  frequency: RecurrenceFrequency.MONTHLY,
  startDate: "2026-01-01",
};

describe("validateCreateRecurringTransactionBody", () => {
  it("accepts a valid recurring transaction without an endDate", () => {
    const result = validateCreateRecurringTransactionBody(validBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endDate).toBeNull();
      expect(result.data.frequency).toBe(RecurrenceFrequency.MONTHLY);
    }
  });

  it("accepts a valid endDate on or after startDate", () => {
    const result = validateCreateRecurringTransactionBody({
      ...validBody,
      endDate: "2026-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an endDate before startDate", () => {
    const result = validateCreateRecurringTransactionBody({
      ...validBody,
      endDate: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid frequency", () => {
    const result = validateCreateRecurringTransactionBody({ ...validBody, frequency: "HOURLY" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing/blank title", () => {
    expect(
      validateCreateRecurringTransactionBody({ ...validBody, title: "" }).success
    ).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(
      validateCreateRecurringTransactionBody({ ...validBody, amount: 0 }).success
    ).toBe(false);
  });

  it("rejects an invalid transaction type", () => {
    expect(
      validateCreateRecurringTransactionBody({ ...validBody, type: "TRANSFER" }).success
    ).toBe(false);
  });

  it("rejects an unparsable startDate", () => {
    expect(
      validateCreateRecurringTransactionBody({ ...validBody, startDate: "soon" }).success
    ).toBe(false);
  });

  it("rejects an unparsable endDate when provided", () => {
    expect(
      validateCreateRecurringTransactionBody({ ...validBody, endDate: "soon" }).success
    ).toBe(false);
  });
});
