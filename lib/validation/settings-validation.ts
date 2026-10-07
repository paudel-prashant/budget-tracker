import { z } from "zod";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

// Shape of PushSubscription.toJSON() in the browser.
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("endpoint must be a valid URL").max(2048),
  keys: z.object({
    p256dh: z.string().min(1, "keys.p256dh is required").max(512),
    auth: z.string().min(1, "keys.auth is required").max(512),
  }),
});

export function validatePushSubscriptionBody(
  body: unknown
): ValidationResult<PushSubscriptionInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(pushSubscriptionSchema.safeParse(body));
  if (!parsed.success) return parsed;

  return {
    success: true,
    data: {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  };
}

export type BudgetSettingsInput = {
  budgetCarryOverEnabled?: boolean;
  budgetAlertsEnabled?: boolean;
};

const budgetSettingsSchema = z
  .object({
    budgetCarryOverEnabled: z.boolean().optional(),
    budgetAlertsEnabled: z.boolean().optional(),
  })
  .refine(
    (value) => value.budgetCarryOverEnabled !== undefined || value.budgetAlertsEnabled !== undefined,
    { message: "Provide budgetCarryOverEnabled and/or budgetAlertsEnabled" }
  );

export function validateBudgetSettingsBody(body: unknown): ValidationResult<BudgetSettingsInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  return toValidationResult(budgetSettingsSchema.safeParse(body));
}
