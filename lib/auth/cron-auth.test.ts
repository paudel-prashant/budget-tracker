import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";

describe("isAuthorizedCronRequest", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("accepts a matching Bearer header", () => {
    expect(isAuthorizedCronRequest("Bearer test-secret")).toBe(true);
  });

  it("rejects a missing header", () => {
    expect(isAuthorizedCronRequest(null)).toBe(false);
  });

  it("rejects a mismatched secret", () => {
    expect(isAuthorizedCronRequest("Bearer wrong-secret")).toBe(false);
  });

  it("rejects a header missing the Bearer prefix", () => {
    expect(isAuthorizedCronRequest("test-secret")).toBe(false);
  });

  it("rejects every request when CRON_SECRET is not configured", () => {
    delete process.env.CRON_SECRET;
    expect(isAuthorizedCronRequest("Bearer test-secret")).toBe(false);
    expect(isAuthorizedCronRequest(null)).toBe(false);
  });
});
