import { z } from "zod";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type GoalInput = {
  name: string;
  category: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
};

const goalSchema = z.object({
  name: z.string().trim().min(1, "name is required and must be a non-empty string").max(120, "name must be 120 characters or fewer"),
  category: z.string().trim().max(60, "category must be 60 characters or fewer").optional(),
  targetAmount: z.number().finite().positive("targetAmount is required and must be a positive number"),
  currentAmount: z.number().finite().nonnegative("currentAmount cannot be negative").optional().default(0),
  targetDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "targetDate must be a valid ISO date string when provided",
    })
    .nullish(),
});

export function validateGoalBody(body: unknown): ValidationResult<GoalInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(goalSchema.safeParse(body));
  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true,
    data: {
      name: parsed.data.name,
      category: parsed.data.category?.trim() || null,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      targetDate:
        parsed.data.targetDate !== undefined && parsed.data.targetDate !== null
          ? new Date(parsed.data.targetDate)
          : null,
    },
  };
}
