import { getCurrentMonthYear, isValidMonthYear } from "@/lib/budget-calculations";

export type CreateBudgetInput = {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
};

type ValidationResult =
  | { success: true; data: CreateBudgetInput }
  | { success: false; error: string };

export function validateCreateBudgetBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const { category, monthlyLimit, month, year } = body as Record<string, unknown>;
  const defaults = getCurrentMonthYear();

  if (typeof category !== "string" || category.trim().length === 0) {
    return {
      success: false,
      error: "category is required and must be a non-empty string",
    };
  }

  if (
    typeof monthlyLimit !== "number" ||
    !Number.isFinite(monthlyLimit) ||
    monthlyLimit <= 0
  ) {
    return {
      success: false,
      error: "monthlyLimit is required and must be a positive number",
    };
  }

  const resolvedMonth = month === undefined ? defaults.month : month;
  const resolvedYear = year === undefined ? defaults.year : year;

  if (typeof resolvedMonth !== "number" || typeof resolvedYear !== "number") {
    return { success: false, error: "month and year must be numbers when provided" };
  }

  if (!isValidMonthYear(resolvedMonth, resolvedYear)) {
    return { success: false, error: "month must be 1–12 and year must be between 2000 and 2100" };
  }

  return {
    success: true,
    data: {
      category: category.trim(),
      monthlyLimit,
      month: resolvedMonth,
      year: resolvedYear,
    },
  };
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
