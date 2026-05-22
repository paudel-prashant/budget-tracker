import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { startOfUtcDay } from "@/lib/recurrence-dates";

export type CreateRecurringTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate: Date | null;
};

type ValidationResult =
  | { success: true; data: CreateRecurringTransactionInput }
  | { success: false; error: string };

const FREQUENCIES = new Set<string>(Object.values(RecurrenceFrequency));

export function validateCreateRecurringTransactionBody(
  body: unknown
): ValidationResult {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const { title, amount, type, category, frequency, startDate, endDate } = body as Record<
    string,
    unknown
  >;

  if (typeof title !== "string" || title.trim().length === 0) {
    return { success: false, error: "title is required and must be a non-empty string" };
  }

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      error: "amount is required and must be a positive number",
    };
  }

  if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
    return { success: false, error: "type must be INCOME or EXPENSE" };
  }

  if (typeof category !== "string" || category.trim().length === 0) {
    return {
      success: false,
      error: "category is required and must be a non-empty string",
    };
  }

  if (typeof frequency !== "string" || !FREQUENCIES.has(frequency)) {
    return {
      success: false,
      error: "frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY",
    };
  }

  if (typeof startDate !== "string" || Number.isNaN(Date.parse(startDate))) {
    return {
      success: false,
      error: "startDate is required and must be a valid ISO date string",
    };
  }

  let parsedEndDate: Date | null = null;

  if (endDate !== undefined && endDate !== null) {
    if (typeof endDate !== "string" || Number.isNaN(Date.parse(endDate))) {
      return {
        success: false,
        error: "endDate must be a valid ISO date string when provided",
      };
    }
    parsedEndDate = startOfUtcDay(new Date(endDate));
  }

  const parsedStartDate = startOfUtcDay(new Date(startDate));

  if (parsedEndDate && parsedEndDate < parsedStartDate) {
    return { success: false, error: "endDate cannot be before startDate" };
  }

  return {
    success: true,
    data: {
      title: title.trim(),
      amount,
      type,
      category: category.trim(),
      frequency: frequency as RecurrenceFrequency,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    },
  };
}
