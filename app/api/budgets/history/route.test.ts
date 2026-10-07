import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, requireApiUserIdMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  requireApiUserIdMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { budget: { findMany: findManyMock } },
}));

const { GET } = await import("@/app/api/budgets/history/route");

describe("GET /api/budgets/history", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
  });

  it("groups budgets by month, newest first", async () => {
    // Prisma returns rows already ordered by year desc, month desc, category asc.
    findManyMock.mockResolvedValue([
      { category: "Food", monthlyLimit: 300.1, month: 9, year: 2026 },
      { category: "Rent", monthlyLimit: 1200.2, month: 9, year: 2026 },
      { category: "Food", monthlyLimit: 250, month: 12, year: 2025 },
    ]);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      history: [
        { month: 9, year: 2026, budgetCount: 2, totalLimit: 1500.3, categories: ["Food", "Rent"] },
        { month: 12, year: 2025, budgetCount: 1, totalLimit: 250, categories: ["Food"] },
      ],
    });
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1" } }));
  });

  it("returns an empty history for a user with no budgets", async () => {
    findManyMock.mockResolvedValue([]);
    const response = await GET();
    expect(await response.json()).toEqual({ history: [] });
  });
});
