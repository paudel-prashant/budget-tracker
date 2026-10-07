import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { findManyMock, createManyMock, requireApiUserIdMock, revalidateMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  createManyMock: vi.fn(),
  requireApiUserIdMock: vi.fn(),
  revalidateMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/utils/revalidate-pages", () => ({ revalidateFinancePages: revalidateMock }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    budget: {
      findMany: findManyMock,
      createMany: createManyMock,
    },
  },
}));

const { POST } = await import("@/app/api/budgets/copy/route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/budgets/copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { from: { month: 9, year: 2026 }, to: { month: 10, year: 2026 } };

describe("POST /api/budgets/copy", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    createManyMock.mockReset();
    revalidateMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
    findManyMock.mockResolvedValue([
      { category: "Food", monthlyLimit: 300, rolloverEnabled: true },
      { category: "Rent", monthlyLimit: 1200, rolloverEnabled: false },
    ]);
    createManyMock.mockResolvedValue({ count: 2 });
  });

  it("copies the source month's budgets into the target month for the current user", async () => {
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ created: 2, skipped: 0 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", month: 9, year: 2026 } })
    );
    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        { category: "Food", monthlyLimit: 300, rolloverEnabled: true, month: 10, year: 2026, userId: "user-1" },
        { category: "Rent", monthlyLimit: 1200, rolloverEnabled: false, month: 10, year: 2026, userId: "user-1" },
      ],
      skipDuplicates: true,
    });
    expect(revalidateMock).toHaveBeenCalled();
  });

  it("reports categories that already existed in the target month as skipped", async () => {
    createManyMock.mockResolvedValue({ count: 1 });
    const response = await POST(makeRequest(validBody));
    expect(await response.json()).toEqual({ created: 1, skipped: 1 });
  });

  it("returns 200 without revalidating when nothing new was created", async () => {
    createManyMock.mockResolvedValue({ count: 0 });
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(200);
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the source month has no budgets", async () => {
    findManyMock.mockResolvedValue([]);
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(404);
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("rejects copying a month onto itself", async () => {
    const response = await POST(makeRequest({ from: validBody.from, to: validBody.from }));
    expect(response.status).toBe(400);
  });

  it("rejects invalid months", async () => {
    const response = await POST(makeRequest({ from: { month: 13, year: 2026 }, to: validBody.to }));
    expect(response.status).toBe(400);
  });

  it("returns the unauthorized response when not signed in", async () => {
    requireApiUserIdMock.mockResolvedValue({
      userId: null,
      unauthorized: new Response(null, { status: 401 }),
    });
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(401);
  });
});
