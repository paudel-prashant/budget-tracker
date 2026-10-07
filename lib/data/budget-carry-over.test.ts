import { beforeEach, describe, expect, it, vi } from "vitest";

const { userUpdateManyMock, budgetCountMock, budgetFindFirstMock, budgetFindManyMock, budgetCreateManyMock } =
  vi.hoisted(() => ({
    userUpdateManyMock: vi.fn(),
    budgetCountMock: vi.fn(),
    budgetFindFirstMock: vi.fn(),
    budgetFindManyMock: vi.fn(),
    budgetCreateManyMock: vi.fn(),
  }));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/domain/budget-calculations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/domain/budget-calculations")>()),
  getCurrentMonthYear: () => ({ month: 1, year: 2027 }),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { updateMany: userUpdateManyMock },
    budget: {
      count: budgetCountMock,
      findFirst: budgetFindFirstMock,
      findMany: budgetFindManyMock,
      createMany: budgetCreateManyMock,
    },
  },
}));

const { ensureBudgetCarryOver, toMonthKey } = await import("@/lib/data/budget-data");

describe("toMonthKey", () => {
  it("zero-pads the month", () => {
    expect(toMonthKey(3, 2026)).toBe("2026-03");
    expect(toMonthKey(12, 2026)).toBe("2026-12");
  });
});

describe("ensureBudgetCarryOver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpdateManyMock.mockResolvedValue({ count: 1 });
    budgetCountMock.mockResolvedValue(0);
    budgetFindFirstMock.mockResolvedValue({ month: 12, year: 2026 });
    budgetFindManyMock.mockResolvedValue([
      { category: "Food", monthlyLimit: 400, rolloverEnabled: false },
      { category: "Rent", monthlyLimit: 1500, rolloverEnabled: true },
    ]);
    budgetCreateManyMock.mockResolvedValue({ count: 2 });
  });

  it("claims the month only for users with carry-over enabled who haven't run it yet", async () => {
    await ensureBudgetCarryOver("user-1");
    expect(userUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        budgetCarryOverEnabled: true,
        OR: [{ budgetCarryOverMonth: null }, { budgetCarryOverMonth: { not: "2027-01" } }],
      },
      data: { budgetCarryOverMonth: "2027-01" },
    });
  });

  it("copies the most recent earlier month (across a year boundary) into an empty month", async () => {
    const created = await ensureBudgetCarryOver("user-1");
    expect(created).toBe(2);
    expect(budgetFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", OR: [{ year: { lt: 2027 } }, { year: 2027, month: { lt: 1 } }] },
      })
    );
    expect(budgetCreateManyMock).toHaveBeenCalledWith({
      data: [
        { category: "Food", monthlyLimit: 400, rolloverEnabled: false, month: 1, year: 2027, userId: "user-1" },
        { category: "Rent", monthlyLimit: 1500, rolloverEnabled: true, month: 1, year: 2027, userId: "user-1" },
      ],
      skipDuplicates: true,
    });
  });

  it("does nothing once the month is already claimed (disabled, already ran, or a concurrent call won)", async () => {
    userUpdateManyMock.mockResolvedValue({ count: 0 });
    expect(await ensureBudgetCarryOver("user-1")).toBe(0);
    expect(budgetCountMock).not.toHaveBeenCalled();
    expect(budgetCreateManyMock).not.toHaveBeenCalled();
  });

  it("never touches a month the user already set up", async () => {
    budgetCountMock.mockResolvedValue(3);
    expect(await ensureBudgetCarryOver("user-1")).toBe(0);
    expect(budgetCreateManyMock).not.toHaveBeenCalled();
  });

  it("does nothing for a user with no earlier budgets", async () => {
    budgetFindFirstMock.mockResolvedValue(null);
    expect(await ensureBudgetCarryOver("user-1")).toBe(0);
    expect(budgetCreateManyMock).not.toHaveBeenCalled();
  });
});
