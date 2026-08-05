import { z } from "zod";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

const assistantMessageSchema = z.object({
  message: z
    .string("message is required")
    .trim()
    .min(1, "message cannot be empty")
    .max(500, "message must be 500 characters or fewer"),
});

export function validateAssistantBody(body: unknown): ValidationResult<{ message: string }> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  return toValidationResult(assistantMessageSchema.safeParse(body));
}
