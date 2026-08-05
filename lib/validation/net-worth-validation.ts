import { z } from "zod";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "@/lib/domain/net-worth-categories";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type AssetInput = {
  name: string;
  category: string;
  value: number;
  asOfDate: Date;
  notes: string | null;
};

export type LiabilityInput = {
  name: string;
  category: string;
  value: number;
  asOfDate: Date;
  notes: string | null;
};

/** Preserves the original behavior: match a known category case-insensitively,
 *  otherwise pass the trimmed value through unchanged (categories aren't a
 *  closed set — users can save their own). */
function normalizeCategory(value: string, allowed: readonly string[]): string {
  const match = allowed.find((c) => c.toLowerCase() === value.toLowerCase());
  return match ?? value;
}

function buildNetWorthItemSchema(allowedCategories: readonly string[]) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(120, "Name must be 120 characters or fewer"),
    category: z
      .string()
      .trim()
      .min(1, "Category is required")
      .transform((value) => normalizeCategory(value, allowedCategories)),
    // Accepts numeric strings too (matches the original `Number(value)` coercion),
    // and `amount`/`value` are aliases resolved before this schema runs.
    value: z.coerce
      .number()
      .finite("Value must be a valid number")
      .nonnegative("Value cannot be negative")
      .transform((value) => Math.round(value * 100) / 100),
    asOfDate: z
      .string()
      .trim()
      .min(1, "asOfDate is required")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: "asOfDate must be a valid date",
      }),
  });
}

const assetSchema = buildNetWorthItemSchema(ASSET_CATEGORIES);
const liabilitySchema = buildNetWorthItemSchema(LIABILITY_CATEGORIES);

function resolveNotes(value: unknown): string | null {
  return typeof value === "string" ? value.trim() || null : null;
}

function validateNetWorthItemBody(
  body: unknown,
  schema: z.ZodType<{ name: string; category: string; value: number; asOfDate: string }>
): ValidationResult<{ name: string; category: string; value: number; asOfDate: Date; notes: string | null }> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const record = body as Record<string, unknown>;
  // `amount` and `value` are accepted as aliases for the same field.
  const normalizedInput = { ...record, value: record.amount ?? record.value };

  const parsed = toValidationResult(schema.safeParse(normalizedInput));
  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true,
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      value: parsed.data.value,
      asOfDate: new Date(parsed.data.asOfDate),
      notes: resolveNotes(record.notes),
    },
  };
}

export function validateAssetBody(body: unknown): ValidationResult<AssetInput> {
  return validateNetWorthItemBody(body, assetSchema);
}

export function validateLiabilityBody(body: unknown): ValidationResult<LiabilityInput> {
  return validateNetWorthItemBody(body, liabilitySchema);
}
