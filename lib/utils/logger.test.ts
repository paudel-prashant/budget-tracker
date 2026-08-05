import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportError } from "@/lib/utils/logger";

describe("reportError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function loggedEntry(): Record<string, unknown> {
    const [line] = consoleErrorSpy.mock.calls[0] as [string];
    return JSON.parse(line);
  }

  it("logs a single JSON line via console.error", () => {
    reportError("Something broke", new Error("boom"));
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(() => loggedEntry()).not.toThrow();
  });

  it("includes the error name and message for Error instances", () => {
    reportError("Something broke", new TypeError("bad type"));
    const entry = loggedEntry();
    expect(entry.error).toMatchObject({ name: "TypeError", message: "bad type" });
  });

  it("handles non-Error thrown values gracefully", () => {
    reportError("Something broke", "a plain string error");
    const entry = loggedEntry();
    expect(entry.error).toMatchObject({ message: "a plain string error" });
  });

  it("merges extra context into the top-level log entry", () => {
    reportError("Something broke", new Error("boom"), { route: "/api/transactions", userId: "u1" });
    const entry = loggedEntry();
    expect(entry.route).toBe("/api/transactions");
    expect(entry.userId).toBe("u1");
  });

  it("always includes a level and an ISO timestamp", () => {
    reportError("Something broke", new Error("boom"));
    const entry = loggedEntry();
    expect(entry.level).toBe("error");
    expect(() => new Date(entry.timestamp as string).toISOString()).not.toThrow();
  });
});
