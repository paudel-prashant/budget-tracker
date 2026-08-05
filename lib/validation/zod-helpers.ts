import type { z } from "zod";

/**
 * Shared result shape used by every hand-written validator in this folder
 * (kept identical whether the validator is Zod-backed or fully manual, so
 * API route call sites never need to know which).
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Converts a Zod `safeParse` result into this app's ValidationResult shape,
 *  surfacing the first validation issue as a single human-readable message
 *  (call sites only ever show one error at a time). */
export function toValidationResult<T>(
  result: { success: true; data: T } | { success: false; error: z.ZodError }
): ValidationResult<T> {
  if (result.success) {
    return { success: true, data: result.data };
  }

  const message = result.error.issues[0]?.message ?? "Invalid request body";
  return { success: false, error: message };
}
