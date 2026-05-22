import type { TransactionType } from "@/lib/types";

/** Select menu value when the user enters a custom category. */
export const OTHER_CATEGORY_OPTION = "Other";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Apparel",
  "Beauty",
  "Data Plan",
  "Education",
  "Entertainment",
  "Food & Beverages",
  "Fuel",
  "Groceries",
  "Healthcare",
  "Household",
  "Insurance",
  "Subscriptions",
  "Transportation",
  "Utilities",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Business",
  "Freelance",
  "Gifts",
  "Investments",
  "Salary",
] as const;

export function buildCategoryOptions(
  extraCategories: string[] = [],
  transactionType?: TransactionType
): string[] {
  const base =
    transactionType === "INCOME"
      ? DEFAULT_INCOME_CATEGORIES
      : transactionType === "EXPENSE"
        ? DEFAULT_EXPENSE_CATEGORIES
        : [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

  const merged = new Set<string>();

  for (const category of base) {
    merged.add(category);
  }

  for (const category of extraCategories) {
    const trimmed = category.trim();
    if (trimmed && trimmed.toLowerCase() !== OTHER_CATEGORY_OPTION.toLowerCase()) {
      merged.add(trimmed);
    }
  }

  return Array.from(merged).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

export function isPresetCategory(value: string, options: string[]): boolean {
  const normalized = value.trim().toLowerCase();
  return options.some((option) => option.toLowerCase() === normalized);
}
