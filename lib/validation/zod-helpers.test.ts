import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toValidationResult } from "@/lib/validation/zod-helpers";

const schema = z.object({ name: z.string().min(1, "name is required") });

describe("toValidationResult", () => {
  it("passes through parsed data on success", () => {
    const result = toValidationResult(schema.safeParse({ name: "Alex" }));
    expect(result).toEqual({ success: true, data: { name: "Alex" } });
  });

  it("surfaces the first issue's message on failure", () => {
    const result = toValidationResult(schema.safeParse({ name: "" }));
    expect(result).toEqual({ success: false, error: "name is required" });
  });

  it("falls back to a generic message if issues are somehow empty", () => {
    // Simulates a ZodError with no issues (shouldn't happen in practice, but the
    // helper should still degrade gracefully rather than reading undefined.message).
    const fakeError = new z.ZodError([]);
    const result = toValidationResult({ success: false, error: fakeError });
    expect(result).toEqual({ success: false, error: "Invalid request body" });
  });
});
