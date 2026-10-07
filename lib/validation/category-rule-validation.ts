import { z } from "zod";
import { CategoryRuleMatch, TransactionType } from "@prisma/client";
import { normalizeTitleKey } from "@/lib/domain/category-suggestion-engine";
import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  normalizeTags,
} from "@/lib/validation/transaction-validation";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type CategoryRuleInput = {
  /** Normalized the same way transaction titles are before matching. */
  pattern: string;
  matchType: CategoryRuleMatch;
  type: TransactionType | null;
  category: string;
  tags: string[];
};

const categoryRuleSchema = z.object({
  pattern: z
    .string()
    .trim()
    .min(1, "pattern is required and must be a non-empty string")
    .max(100, "pattern must be 100 characters or fewer"),
  matchType: z
    .nativeEnum(CategoryRuleMatch, { message: "matchType must be CONTAINS, STARTS_WITH, or EXACT" })
    .optional()
    .default(CategoryRuleMatch.CONTAINS),
  type: z
    .nativeEnum(TransactionType, { message: "type must be INCOME, EXPENSE, or null" })
    .nullish(),
  category: z
    .string()
    .trim()
    .min(1, "category is required and must be a non-empty string")
    .max(60, "category must be 60 characters or fewer"),
  tags: z
    .array(z.string().trim().min(1).max(MAX_TAG_LENGTH, `tags must be ${MAX_TAG_LENGTH} characters or fewer`))
    .max(MAX_TAGS, `no more than ${MAX_TAGS} tags per rule`)
    .optional(),
});

export function validateCategoryRuleBody(body: unknown): ValidationResult<CategoryRuleInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(categoryRuleSchema.safeParse(body));
  if (!parsed.success) return parsed;

  const pattern = normalizeTitleKey(parsed.data.pattern);
  if (!pattern) {
    return { success: false, error: "pattern must contain at least one letter or number" };
  }

  return {
    success: true,
    data: {
      pattern,
      matchType: parsed.data.matchType,
      type: parsed.data.type ?? null,
      category: parsed.data.category,
      tags: normalizeTags(parsed.data.tags ?? []),
    },
  };
}
