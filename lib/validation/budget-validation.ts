import { z } from "zod";
import { getCurrentMonthYear, isValidMonthYear } from "@/lib/domain/budget-calculations";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type CreateBudgetInput = {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
  rolloverEnabled: boolean;
};

const budgetFieldsSchema = z.object({
  category: z.string().trim().min(1, "category is required and must be a non-empty string"),
  monthlyLimit: z
    .number()
    .finite()
    .positive("monthlyLimit is required and must be a positive number"),
  // month/year default to the current calendar month/year when omitted (resolved below,
  // since the default is computed at request time, not a fixed value).
  month: z.number().optional(),
  year: z.number().optional(),
  rolloverEnabled: z.boolean().optional().default(false),
});

export function validateCreateBudgetBody(body: unknown): ValidationResult<CreateBudgetInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(budgetFieldsSchema.safeParse(body));
  if (!parsed.success) {
    return parsed;
  }

  const defaults = getCurrentMonthYear();
  const resolvedMonth = parsed.data.month ?? defaults.month;
  const resolvedYear = parsed.data.year ?? defaults.year;

  if (!isValidMonthYear(resolvedMonth, resolvedYear)) {
    return { success: false, error: "month must be 1–12 and year must be between 2000 and 2100" };
  }

  return {
    success: true,
    data: {
      category: parsed.data.category,
      monthlyLimit: parsed.data.monthlyLimit,
      month: resolvedMonth,
      year: resolvedYear,
      rolloverEnabled: parsed.data.rolloverEnabled,
    },
  };
}

export type UpdateBudgetInput = {
  monthlyLimit: number;
  rolloverEnabled: boolean;
};

// Only the limit and the rollover toggle are editable — category/month/year define
// which budget this *is*; changing them means creating a different budget entirely.
const budgetUpdateSchema = z.object({
  monthlyLimit: z
    .number()
    .finite()
    .positive("monthlyLimit is required and must be a positive number"),
  rolloverEnabled: z.boolean().optional().default(false),
});

export function validateUpdateBudgetBody(body: unknown): ValidationResult<UpdateBudgetInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  return toValidationResult(budgetUpdateSchema.safeParse(body));
}

export function parseMonthYearSearchParams(
  searchParams: URLSearchParams
): { month: number; year: number } | { error: string } {
  const defaults = getCurrentMonthYear();
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const month = monthParam === null ? defaults.month : Number(monthParam);
  const year = yearParam === null ? defaults.year : Number(yearParam);

  if (!Number.isFinite(month) || !Number.isFinite(year)) {
    return { error: "month and year query parameters must be valid numbers" };
  }

  if (!isValidMonthYear(month, year)) {
    return { error: "month must be 1–12 and year must be between 2000 and 2100" };
  }

  return { month, year };
}
