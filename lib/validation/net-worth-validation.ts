import { z } from "zod";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "@/lib/domain/net-worth-categories";
import { isGoldCategory } from "@/lib/domain/gold";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type AssetInput = {
  name: string;
  category: string;
  value: number;
  asOfDate: Date;
  notes: string | null;
  /** Set only for Gold assets. */
  goldGrams: number | null;
  goldPurity: number | null;
  costBasis: number | null;
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

/** Blank/absent → null; otherwise must be a finite number. */
function optionalNumber(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "invalid";
}

export function validateAssetBody(body: unknown): ValidationResult<AssetInput> {
  const base = validateNetWorthItemBody(body, assetSchema);
  if (!base.success) return base;

  const record = body as Record<string, unknown>;
  const costBasis = optionalNumber(record.costBasis);
  if (costBasis === "invalid" || (costBasis !== null && costBasis < 0)) {
    return { success: false, error: "Purchase cost must be a non-negative number" };
  }

  if (!isGoldCategory(base.data.category)) {
    return {
      success: true,
      data: { ...base.data, goldGrams: null, goldPurity: null, costBasis },
    };
  }

  const goldGrams = optionalNumber(record.goldGrams);
  if (goldGrams === null || goldGrams === "invalid" || goldGrams <= 0) {
    return { success: false, error: "Gold weight must be greater than zero" };
  }

  const goldPurity = optionalNumber(record.goldPurity);
  if (goldPurity === null || goldPurity === "invalid" || goldPurity <= 0 || goldPurity > 1) {
    return { success: false, error: "Gold purity must be between 0 and 1" };
  }

  return {
    success: true,
    data: {
      ...base.data,
      goldGrams: Math.round(goldGrams * 10000) / 10000,
      goldPurity,
      costBasis: costBasis === null ? null : Math.round(costBasis * 100) / 100,
    },
  };
}

export function validateLiabilityBody(body: unknown): ValidationResult<LiabilityInput> {
  return validateNetWorthItemBody(body, liabilitySchema);
}
