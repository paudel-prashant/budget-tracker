import { describe, expect, it } from "vitest";
import { validateAssistantBody } from "@/lib/validation/assistant-validation";

describe("validateAssistantBody", () => {
  it("accepts a valid message and trims it", () => {
    const result = validateAssistantBody({ message: "  How much did I spend on food?  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("How much did I spend on food?");
    }
  });

  it("rejects a non-object body", () => {
    expect(validateAssistantBody(null).success).toBe(false);
    expect(validateAssistantBody("hello").success).toBe(false);
  });

  it("rejects a missing message", () => {
    expect(validateAssistantBody({}).success).toBe(false);
  });

  it("rejects a non-string message", () => {
    expect(validateAssistantBody({ message: 42 }).success).toBe(false);
  });

  it("rejects an empty or whitespace-only message", () => {
    expect(validateAssistantBody({ message: "" }).success).toBe(false);
    expect(validateAssistantBody({ message: "   " }).success).toBe(false);
  });

  it("rejects a message over 500 characters", () => {
    expect(validateAssistantBody({ message: "a".repeat(501) }).success).toBe(false);
  });

  it("accepts a message at exactly 500 characters", () => {
    expect(validateAssistantBody({ message: "a".repeat(500) }).success).toBe(true);
  });
});
