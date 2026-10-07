import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireApiUserIdMock,
  assetFindFirstMock,
  liabilityFindFirstMock,
  accountCreateMock,
  assetDeleteMock,
  liabilityDeleteMock,
  transactionMock,
} = vi.hoisted(() => ({
  requireApiUserIdMock: vi.fn(),
  assetFindFirstMock: vi.fn(),
  liabilityFindFirstMock: vi.fn(),
  accountCreateMock: vi.fn(),
  assetDeleteMock: vi.fn(),
  liabilityDeleteMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/utils/revalidate-pages", () => ({ revalidateFinancePages: vi.fn() }));
vi.mock("@/lib/data/finance-account-data", () => ({ syncAllFinanceAccountBalances: vi.fn() }));
vi.mock("@/lib/data/user-settings-data", () => ({ getUserPreferredCurrency: async () => "CAD" }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    asset: { findFirst: assetFindFirstMock, delete: assetDeleteMock },
    liability: { findFirst: liabilityFindFirstMock, delete: liabilityDeleteMock },
    financeAccount: { create: accountCreateMock },
    $transaction: transactionMock,
  },
}));

const { POST } = await import("@/app/api/net-worth/convert/route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/net-worth/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/net-worth/convert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
    accountCreateMock.mockImplementation((args) => ({ id: "acct-new", ...args.data }));
    assetDeleteMock.mockReturnValue({ deleted: true });
    liabilityDeleteMock.mockReturnValue({ deleted: true });
    transactionMock.mockImplementation(async (ops: unknown[]) => ops);
  });

  it("replaces a TFSA asset with an investment account at the same value", async () => {
    assetFindFirstMock.mockResolvedValue({ id: "a1", name: "TFSA", value: 18250, category: "Investments" });

    const response = await POST(makeRequest({ kind: "asset", id: "a1", type: "INVESTMENT" }));

    expect(response.status).toBe(201);
    expect(assetFindFirstMock).toHaveBeenCalledWith({ where: { id: "a1", userId: "user-1" } });
    expect(accountCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        name: "TFSA",
        type: "INVESTMENT",
        openingBalance: 18250,
        creditLimit: null,
      }),
    });
    expect(assetDeleteMock).toHaveBeenCalledWith({ where: { id: "a1" } });
  });

  it("turns a credit card liability into a negative-balance card with its limit", async () => {
    liabilityFindFirstMock.mockResolvedValue({ id: "l1", name: "Visa", value: 640, category: "Credit Card" });

    await POST(makeRequest({ kind: "liability", id: "l1", type: "CREDIT", creditLimit: 5000 }));

    expect(accountCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "CREDIT", openingBalance: -640, creditLimit: 5000 }),
    });
    expect(liabilityDeleteMock).toHaveBeenCalledWith({ where: { id: "l1" } });
  });

  it("returns 404 for an item the user doesn't own", async () => {
    assetFindFirstMock.mockResolvedValue(null);
    const response = await POST(makeRequest({ kind: "asset", id: "nope", type: "SAVINGS" }));
    expect(response.status).toBe(404);
    expect(accountCreateMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown kind or account type", async () => {
    expect((await POST(makeRequest({ kind: "car", id: "a1", type: "SAVINGS" }))).status).toBe(400);
    expect((await POST(makeRequest({ kind: "asset", id: "a1", type: "BOND" }))).status).toBe(400);
  });
});
