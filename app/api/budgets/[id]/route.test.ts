import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AuthResult =
  | { userId: string; unauthorized: null }
  | { userId: null; unauthorized: Response };

const existingBudget = {
  id: "budget-1",
  userId: "user-1",
  category: "Food",
  monthlyLimit: 300,
  month: 6,
  year: 2026,
  rolloverEnabled: false,
  createdAt: new Date("2026-06-01"),
};

const { findFirstMock, updateMock, deleteMock, requireApiUserIdMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  requireApiUserIdMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/utils/revalidate-pages", () => ({ revalidateFinancePages: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    budget: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

const { PATCH, DELETE } = await import("@/app/api/budgets/[id]/route");

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/budgets/budget-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/budgets/[id]", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    findFirstMock.mockResolvedValue(existingBudget);
    updateMock.mockResolvedValue({ ...existingBudget, monthlyLimit: 350, rolloverEnabled: true });
  });

  it("updates monthlyLimit and rolloverEnabled for an owned budget", async () => {
    const response = await PATCH(
      makeRequest({ monthlyLimit: 350, rolloverEnabled: true }),
      makeContext("budget-1")
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.monthlyLimit).toBe(350);
    expect(json.rolloverEnabled).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "budget-1" },
      data: { monthlyLimit: 350, rolloverEnabled: true },
    });
  });

  it("never lets category/month/year be changed through the update payload", async () => {
    await PATCH(
      makeRequest({ monthlyLimit: 350, category: "Rent", month: 1, year: 2000 }),
      makeContext("budget-1")
    );
    const updateData = updateMock.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty("category");
    expect(updateData).not.toHaveProperty("month");
    expect(updateData).not.toHaveProperty("year");
  });

  it("returns 404 and never updates when not owned by the caller", async () => {
    findFirstMock.mockResolvedValue(null);
    const response = await PATCH(makeRequest({ monthlyLimit: 350 }), makeContext("someone-elses"));
    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 400 and never updates on a non-positive monthlyLimit", async () => {
    const response = await PATCH(makeRequest({ monthlyLimit: 0 }), makeContext("budget-1"));
    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 401 and never updates when unauthenticated", async () => {
    requireApiUserIdMock.mockResolvedValueOnce({
      userId: null,
      unauthorized: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } satisfies AuthResult);

    const response = await PATCH(makeRequest({ monthlyLimit: 350 }), makeContext("budget-1"));
    expect(response.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/budgets/[id]", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    deleteMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    findFirstMock.mockResolvedValue(existingBudget);
  });

  it("returns 404 and never deletes when not owned by the caller", async () => {
    findFirstMock.mockResolvedValue(null);
    const response = await DELETE(
      new NextRequest("http://localhost/api/budgets/budget-1", { method: "DELETE" }),
      makeContext("budget-1")
    );
    expect(response.status).toBe(404);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
