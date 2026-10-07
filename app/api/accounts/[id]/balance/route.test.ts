import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiUserIdMock, findFirstMock, updateMock, syncMock } = vi.hoisted(() => ({
  requireApiUserIdMock: vi.fn(),
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  syncMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/utils/revalidate-pages", () => ({ revalidateFinancePages: vi.fn() }));
vi.mock("@/lib/data/finance-account-data", () => ({ syncAllFinanceAccountBalances: syncMock }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { financeAccount: { findFirst: findFirstMock, update: updateMock } },
}));

const { POST } = await import("@/app/api/accounts/[id]/balance/route");

function call(balance: unknown) {
  return POST(
    new NextRequest("http://localhost/api/accounts/tfsa/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance }),
    }),
    { params: Promise.resolve({ id: "tfsa" }) }
  );
}

describe("POST /api/accounts/[id]/balance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
    // Opening 10,000 + 2,000 of contributions = current 12,000.
    findFirstMock.mockResolvedValue({ id: "tfsa", openingBalance: 10000 });
    syncMock.mockResolvedValue(new Map([["tfsa", 12000]]));
  });

  it("shifts the opening balance so the current balance matches, without a transaction", async () => {
    const response = await call(12850.4);
    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "tfsa" },
      data: { openingBalance: 10850.4 },
    });
  });

  it("handles a market drop", async () => {
    await call(11500);
    expect(updateMock).toHaveBeenCalledWith({ where: { id: "tfsa" }, data: { openingBalance: 9500 } });
  });

  it("returns 404 for another user's account", async () => {
    findFirstMock.mockResolvedValue(null);
    expect((await call(100)).status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric balance", async () => {
    expect((await call("lots")).status).toBe(400);
  });
});
