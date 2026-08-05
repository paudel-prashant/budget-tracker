import { z } from "zod";
import { TransactionType } from "@prisma/client";
import { isSupportedCurrency, normalizeCurrencyCode } from "@/lib/currency/constants";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type CreateTransactionInput = {
  title: string;
  amount: number;
  currency?: string;
  type: TransactionType;
  category: string;
  date: Date;
};

// Field order mirrors the original hand-written checks (title, amount, type,
// category, date, currency) so the first reported issue matches what callers
// saw before this was Zod-backed.
const transactionSchema = z.object({
  title: z.string().trim().min(1, "title is required and must be a non-empty string"),
  amount: z.number().finite().positive("amount is required and must be a positive number"),
  type: z.nativeEnum(TransactionType, { message: "type must be INCOME or EXPENSE" }),
  category: z.string().trim().min(1, "category is required and must be a non-empty string"),
  date: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "date is required and must be a valid ISO date string",
    }),
  currency: z
    .string()
    .refine(isSupportedCurrency, { message: "currency must be a supported ISO currency code" })
    .optional(),
});

export function validateTransactionBody(body: unknown): ValidationResult<CreateTransactionInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(transactionSchema.safeParse(body));
  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true,
    data: {
      title: parsed.data.title,
      amount: parsed.data.amount,
      currency: parsed.data.currency ? normalizeCurrencyCode(parsed.data.currency) : undefined,
      type: parsed.data.type,
      category: parsed.data.category,
      date: new Date(parsed.data.date),
    },
  };
}

/** @deprecated Use validateTransactionBody */
export const validateCreateTransactionBody = validateTransactionBody;
