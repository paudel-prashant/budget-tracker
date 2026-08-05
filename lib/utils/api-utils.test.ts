import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";

describe("jsonError", () => {
  it("returns a JSON response with the given message and status", async () => {
    const response = jsonError("Nope", 418);
    expect(response.status).toBe(418);
    expect(await response.json()).toEqual({ error: "Nope" });
  });
});

describe("handleApiError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("maps P2025 (record not found) to a 404", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "6.19.3",
    });
    const response = handleApiError(error);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Record not found" });
  });

  it("maps P2002 on importHash to a 409 with an import-specific message", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "6.19.3",
      meta: { target: ["userId", "importHash"] },
    });
    const response = handleApiError(error);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Another transaction with the same details already exists",
    });
  });

  it("maps other P2002 conflicts to the budget-uniqueness message", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "6.19.3",
      meta: { target: ["userId", "category", "month", "year"] },
    });
    const response = handleApiError(error);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "A budget already exists for this category and month",
    });
  });

  it("maps a DB initialization failure to a 503 and logs it", async () => {
    const error = new Prisma.PrismaClientInitializationError("Can't reach database", "6.19.3");
    const response = handleApiError(error);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Database is unavailable. Check DATABASE_URL and Postgres configuration.",
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("maps a missing DATABASE_URL error to a 503 with its own message", async () => {
    const error = new Error("DATABASE_URL is not set.");
    const response = handleApiError(error);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "DATABASE_URL is not set." });
  });

  it("falls back to a generic 500 for unrecognized errors and logs it", async () => {
    const error = new Error("Something unexpected");
    const response = handleApiError(error);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("handles non-Error thrown values without crashing", async () => {
    const response = handleApiError("just a string");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});
