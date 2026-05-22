import { TransactionType } from "@prisma/client";

export type CreateTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
};

type ValidationResult =
  | { success: true; data: CreateTransactionInput }
  | { success: false; error: string };

export function validateTransactionBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const { title, amount, type, category, date } = body as Record<string, unknown>;

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

  if (typeof date !== "string" || Number.isNaN(Date.parse(date))) {
    return {
      success: false,
      error: "date is required and must be a valid ISO date string",
    };
  }

  return {
    success: true,
    data: {
      title: title.trim(),
      amount,
      type,
      category: category.trim(),
      date: new Date(date),
    },
  };
}

/** @deprecated Use validateTransactionBody */
export const validateCreateTransactionBody = validateTransactionBody;
