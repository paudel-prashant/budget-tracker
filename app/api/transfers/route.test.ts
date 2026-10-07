import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { accountCountMock, transferCreateMock, syncMock, requireApiUserIdMock } = vi.hoisted(() => ({
  accountCountMock: vi.fn(),
  transferCreateMock: vi.fn(),
  syncMock: vi.fn(),
  requireApiUserIdMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/utils/revalidate-pages", () => ({ revalidateFinancePages: vi.fn() }));
vi.mock("@/lib/data/finance-account-data", () => ({ syncAllFinanceAccountBalances: syncMock }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    financeAccount: { count: accountCountMock },
    transfer: { create: transferCreateMock },
  },
}));

const { POST } = await import("@/app/api/transfers/route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  fromAccountId: "checking",
  toAccountId: "savings",
  amount: 250,
  date: "2026-10-01T00:00:00.000Z",
  note: "Monthly savings",
};

describe("POST /api/transfers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
    accountCountMock.mockResolvedValue(2);
    transferCreateMock.mockResolvedValue({ id: "transfer-1" });
  });

  it("records a transfer between two owned accounts and resyncs balances", async () => {
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(201);
    expect(accountCountMock).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { in: ["checking", "savings"] } },
    });
    expect(transferCreateMock).toHaveBeenCalledWith({
      data: {
        fromAccountId: "checking",
        toAccountId: "savings",
        amount: 250,
        date: new Date(validBody.date),
        note: "Monthly savings",
        userId: "user-1",
      },
    });
    expect(syncMock).toHaveBeenCalledWith("user-1");
  });

  it("returns 404 when either account belongs to someone else", async () => {
    accountCountMock.mockResolvedValue(1);
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(404);
    expect(transferCreateMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a transfer to the same account", async () => {
    const response = await POST(makeRequest({ ...validBody, toAccountId: "checking" }));
    expect(response.status).toBe(400);
  });
});
