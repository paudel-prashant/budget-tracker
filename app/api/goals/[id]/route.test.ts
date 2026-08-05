import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AuthResult =
  | { userId: string; unauthorized: null }
  | { userId: null; unauthorized: Response };

const now = new Date("2026-06-01");
const existingGoal = {
  id: "goal-1",
  userId: "user-1",
  name: "Emergency fund",
  category: "Savings",
  targetAmount: 5000,
  currentAmount: 1200,
  targetDate: new Date("2027-01-01"),
  createdAt: now,
  updatedAt: now,
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
    goal: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

const { PATCH, DELETE } = await import("@/app/api/goals/[id]/route");

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/goals/goal-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  name: "Emergency fund",
  category: "Savings",
  targetAmount: 6000,
  currentAmount: 2000,
};

describe("PATCH /api/goals/[id]", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    findFirstMock.mockResolvedValue(existingGoal);
    updateMock.mockResolvedValue({ ...existingGoal, targetAmount: 6000, currentAmount: 2000 });
  });

  it("updates an owned goal and returns the serialized result", async () => {
    const response = await PATCH(makeRequest(validPayload), makeContext("goal-1"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.targetAmount).toBe(6000);
    expect(json.currentAmount).toBe(2000);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "goal-1" },
      data: expect.objectContaining({ targetAmount: 6000, currentAmount: 2000 }),
    });
  });

  it("returns 404 and never updates when not owned by the caller", async () => {
    findFirstMock.mockResolvedValue(null);
    const response = await PATCH(makeRequest(validPayload), makeContext("someone-elses"));
    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 400 and never updates on invalid input", async () => {
    const response = await PATCH(makeRequest({ ...validPayload, targetAmount: -1 }), makeContext("goal-1"));
    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 401 and never updates when unauthenticated", async () => {
    requireApiUserIdMock.mockResolvedValueOnce({
      userId: null,
      unauthorized: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } satisfies AuthResult);

    const response = await PATCH(makeRequest(validPayload), makeContext("goal-1"));
    expect(response.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/goals/[id]", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    deleteMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    findFirstMock.mockResolvedValue(existingGoal);
  });

  it("deletes an owned goal", async () => {
    const response = await DELETE(
      new NextRequest("http://localhost/api/goals/goal-1", { method: "DELETE" }),
      makeContext("goal-1")
    );
    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "goal-1" } });
  });

  it("returns 404 and never deletes when not owned by the caller", async () => {
    findFirstMock.mockResolvedValue(null);
    const response = await DELETE(
      new NextRequest("http://localhost/api/goals/goal-1", { method: "DELETE" }),
      makeContext("goal-1")
    );
    expect(response.status).toBe(404);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
