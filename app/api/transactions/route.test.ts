import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireApiUserIdMock,
  resolveAccountMock,
  createMock,
  prismaTransactionMock,
  scheduleAlertsMock,
  learnMappingMock,
} = vi.hoisted(() => ({
  requireApiUserIdMock: vi.fn(),
  resolveAccountMock: vi.fn(),
  createMock: vi.fn(),
  prismaTransactionMock: vi.fn(),
  scheduleAlertsMock: vi.fn(),
  learnMappingMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/utils/revalidate-pages", () => ({ revalidateFinancePages: vi.fn() }));
vi.mock("@/lib/domain/recurring-processor", () => ({ processRecurringTransactions: vi.fn() }));
vi.mock("@/lib/domain/category-mapping-service", () => ({
  upsertLearnedCategoryMapping: learnMappingMock,
}));
vi.mock("@/lib/data/budget-alerts", () => ({ scheduleBudgetAlertCheck: scheduleAlertsMock }));
vi.mock("@/lib/data/finance-account-data", () => ({
  resolveTransactionAccountId: resolveAccountMock,
  syncFinanceAccountsForUser: vi.fn(),
}));
// Same-currency write: baseAmount = amount, so the test focuses on split behavior.
vi.mock("@/lib/currency/transaction-write", () => ({
  buildTransactionWriteData: vi.fn(async (_userId: string, input: Record<string, unknown>) => ({
    title: input.title,
    amount: input.amount,
    currency: "CAD",
    baseAmount: input.amount,
    type: input.type,
    category: input.category,
    date: input.date,
    tags: input.tags ?? [],
  })),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    transaction: { create: createMock },
    $transaction: prismaTransactionMock,
  },
}));

const { POST } = await import("@/app/api/transactions/route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseBody = {
  title: "Costco",
  amount: 160,
  type: "EXPENSE",
  category: "Food",
  date: "2026-10-05T00:00:00.000Z",
};

function rowFrom(args: { data: Record<string, unknown> }, id: string) {
  return {
    id,
    createdAt: new Date("2026-10-05"),
    ...args.data,
  };
}

describe("POST /api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
    resolveAccountMock.mockResolvedValue("acct-primary");
    createMock.mockImplementation(async (args) => rowFrom(args, "tx-1"));
    // prisma.$transaction receives the already-built create() results.
    prismaTransactionMock.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("creates one row per split part sharing a splitGroupId", async () => {
    const response = await POST(
      makeRequest({
        ...baseBody,
        splits: [
          { category: "Food", amount: 120 },
          { category: "Household", amount: 40 },
        ],
      })
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(2);

    const [first, second] = createMock.mock.calls.map(([args]) => args.data);
    expect(first).toMatchObject({ category: "Food", amount: 120, financeAccountId: "acct-primary" });
    expect(second).toMatchObject({ category: "Household", amount: 40, financeAccountId: "acct-primary" });
    expect(first.splitGroupId).toEqual(expect.any(String));
    expect(second.splitGroupId).toBe(first.splitGroupId);

    const json = await response.json();
    expect(json.transactions).toHaveLength(2);
    // A split purchase shouldn't teach "Costco → Food" as the title's category.
    expect(learnMappingMock).not.toHaveBeenCalled();
    expect(scheduleAlertsMock).toHaveBeenCalledWith("user-1");
  });

  it("creates a single transaction on the requested account", async () => {
    resolveAccountMock.mockResolvedValue("acct-savings");
    const response = await POST(makeRequest({ ...baseBody, financeAccountId: "acct-savings" }));

    expect(response.status).toBe(201);
    expect(resolveAccountMock).toHaveBeenCalledWith("user-1", "acct-savings");
    expect(createMock.mock.calls[0][0].data).toMatchObject({
      financeAccountId: "acct-savings",
      category: "Food",
    });
    expect((await response.json()).financeAccountId).toBe("acct-savings");
  });

  it("rejects an account the user doesn't own", async () => {
    resolveAccountMock.mockResolvedValue(null);
    const response = await POST(makeRequest({ ...baseBody, financeAccountId: "someone-else" }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("doesn't check budget alerts for income", async () => {
    await POST(makeRequest({ ...baseBody, type: "INCOME", category: "Salary" }));
    expect(scheduleAlertsMock).not.toHaveBeenCalled();
  });
});
