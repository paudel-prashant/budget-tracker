import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AuthResult =
  | { userId: string; unauthorized: null }
  | { userId: null; unauthorized: Response };

const existingRecurring = {
  id: "rec-1",
  userId: "user-1",
  title: "Rent",
  amount: 1500,
  type: "EXPENSE",
  category: "Housing",
  frequency: "MONTHLY",
  startDate: new Date("2026-01-01"),
  endDate: null,
  lastProcessedAt: new Date("2026-01-01"),
  createdAt: new Date("2026-01-01"),
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
    recurringTransaction: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

const { PATCH, DELETE } = await import("@/app/api/recurring-transactions/[id]/route");

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/recurring-transactions/rec-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  title: "Rent",
  amount: 1650, // price went up
  type: "EXPENSE",
  category: "Housing",
  frequency: "MONTHLY",
  startDate: "2026-01-01",
};

describe("PATCH /api/recurring-transactions/[id]", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    findFirstMock.mockResolvedValue(existingRecurring);
    updateMock.mockResolvedValue({ ...existingRecurring, amount: 1650 });
  });

  it("updates an owned recurring transaction and returns the serialized result", async () => {
    const response = await PATCH(makeRequest(validPayload), makeContext("rec-1"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.amount).toBe(1650);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "rec-1" },
      data: expect.objectContaining({ amount: 1650, title: "Rent" }),
    });
    // lastProcessedAt must never be part of the update payload — editing must
    // not reset/replay already-generated occurrences.
    expect(updateMock.mock.calls[0][0].data).not.toHaveProperty("lastProcessedAt");
  });

  it("returns 404 and never updates when the recurring transaction isn't owned by the caller", async () => {
    findFirstMock.mockResolvedValue(null);
    const response = await PATCH(makeRequest(validPayload), makeContext("someone-elses"));
    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 400 and never updates on invalid input", async () => {
    const response = await PATCH(makeRequest({ ...validPayload, amount: -5 }), makeContext("rec-1"));
    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 401 and never updates when unauthenticated", async () => {
    requireApiUserIdMock.mockResolvedValueOnce({
      userId: null,
      unauthorized: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } satisfies AuthResult);

    const response = await PATCH(makeRequest(validPayload), makeContext("rec-1"));
    expect(response.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/recurring-transactions/[id]", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    deleteMock.mockReset();
    requireApiUserIdMock.mockReset();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null } satisfies AuthResult);
    findFirstMock.mockResolvedValue(existingRecurring);
  });

  it("returns 404 and never deletes when not owned by the caller", async () => {
    findFirstMock.mockResolvedValue(null);
    const response = await DELETE(
      new NextRequest("http://localhost/api/recurring-transactions/rec-1", { method: "DELETE" }),
      makeContext("rec-1")
    );
    expect(response.status).toBe(404);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
