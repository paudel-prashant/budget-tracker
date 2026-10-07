import { describe, expect, it } from "vitest";
import {
  validateBudgetSettingsBody,
  validatePushSubscriptionBody,
} from "@/lib/validation/settings-validation";

describe("validatePushSubscriptionBody", () => {
  it("flattens a browser PushSubscription.toJSON() payload", () => {
    const result = validatePushSubscriptionBody({
      endpoint: "https://push.example.com/abc",
      expirationTime: null,
      keys: { p256dh: "key", auth: "secret" },
    });
    expect(result).toEqual({
      success: true,
      data: { endpoint: "https://push.example.com/abc", p256dh: "key", auth: "secret" },
    });
  });

  it("rejects a missing key", () => {
    expect(
      validatePushSubscriptionBody({ endpoint: "https://push.example.com/abc", keys: { p256dh: "k" } })
        .success
    ).toBe(false);
  });

  it("rejects a non-URL endpoint", () => {
    expect(
      validatePushSubscriptionBody({ endpoint: "nope", keys: { p256dh: "k", auth: "a" } }).success
    ).toBe(false);
  });
});

describe("validateBudgetSettingsBody", () => {
  it("accepts either setting on its own", () => {
    expect(validateBudgetSettingsBody({ budgetAlertsEnabled: false })).toEqual({
      success: true,
      data: { budgetAlertsEnabled: false },
    });
    expect(validateBudgetSettingsBody({ budgetCarryOverEnabled: true }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(validateBudgetSettingsBody({}).success).toBe(false);
  });

  it("rejects non-boolean values", () => {
    expect(validateBudgetSettingsBody({ budgetAlertsEnabled: "yes" }).success).toBe(false);
  });
});
