import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AuthResult =
  | { userId: string; unauthorized: null }
  | { userId: null; unauthorized: Response };

const now = new Date("2026-06-01");
const sampleGoal = {
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

const { findManyMock, createMock, requireApiUserIdMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  createMock: vi.fn(),
  requireApiUserIdMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/utils/revalidate-pages", () => ({ revalidateFinancePages: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    goal: {
      findMany: findManyMock,
      create: createMock,
    },
  },
}));

const { GET, POST } = await import("@/app/api/goals/route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/goals", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    findManyMock.mockResolvedValue([sampleGoal]);
  });

  it("returns the caller's goals, serialized", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveLength(1);
    expect(json[0]).toMatchObject({ id: "goal-1", name: "Emergency fund", targetAmount: 5000 });
    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    requireApiUserIdMock.mockResolvedValueOnce({
      userId: null,
      unauthorized: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } satisfies AuthResult);

    const response = await GET();
    expect(response.status).toBe(401);
  });
});

describe("POST /api/goals", () => {
  beforeEach(() => {
    createMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    createMock.mockResolvedValue(sampleGoal);
  });

  it("creates a goal scoped to the caller", async () => {
    const response = await POST(
      makeRequest({ name: "Emergency fund", targetAmount: 5000, currentAmount: 1200, category: "Savings" })
    );
    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", name: "Emergency fund", targetAmount: 5000 }),
    });
  });

  it("returns 400 and never creates on invalid input", async () => {
    const response = await POST(makeRequest({ name: "", targetAmount: 5000 }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 401 and never creates when unauthenticated", async () => {
    requireApiUserIdMock.mockResolvedValueOnce({
      userId: null,
      unauthorized: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } satisfies AuthResult);

    const response = await POST(makeRequest({ name: "Emergency fund", targetAmount: 5000 }));
    expect(response.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });
});
