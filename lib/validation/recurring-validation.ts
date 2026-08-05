import { z } from "zod";
import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { startOfUtcDay } from "@/lib/domain/recurrence-dates";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type CreateRecurringTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate: Date | null;
};

const recurringFieldsSchema = z.object({
  title: z.string().trim().min(1, "title is required and must be a non-empty string"),
  amount: z.number().finite().positive("amount is required and must be a positive number"),
  type: z.nativeEnum(TransactionType, { message: "type must be INCOME or EXPENSE" }),
  category: z.string().trim().min(1, "category is required and must be a non-empty string"),
  frequency: z.nativeEnum(RecurrenceFrequency, {
    message: "frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY",
  }),
  startDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "startDate is required and must be a valid ISO date string",
  }),
  endDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "endDate must be a valid ISO date string when provided",
    })
    .nullish(),
});

export function validateCreateRecurringTransactionBody(
  body: unknown
): ValidationResult<CreateRecurringTransactionInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(recurringFieldsSchema.safeParse(body));
  if (!parsed.success) {
    return parsed;
  }

  const parsedStartDate = startOfUtcDay(new Date(parsed.data.startDate));
  const parsedEndDate =
    parsed.data.endDate !== undefined && parsed.data.endDate !== null
      ? startOfUtcDay(new Date(parsed.data.endDate))
      : null;

  if (parsedEndDate && parsedEndDate < parsedStartDate) {
    return { success: false, error: "endDate cannot be before startDate" };
  }

  return {
    success: true,
    data: {
      title: parsed.data.title,
      amount: parsed.data.amount,
      type: parsed.data.type,
      category: parsed.data.category,
      frequency: parsed.data.frequency,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    },
  };
}
