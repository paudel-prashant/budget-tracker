import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const {
  userFindUniqueMock,
  subscriptionCountMock,
  alertLogFindManyMock,
  alertLogCreateMock,
  getBudgetsWithProgressMock,
  sendPushToUserMock,
  isPushConfiguredMock,
} = vi.hoisted(() => ({
  userFindUniqueMock: vi.fn(),
  subscriptionCountMock: vi.fn(),
  alertLogFindManyMock: vi.fn(),
  alertLogCreateMock: vi.fn(),
  getBudgetsWithProgressMock: vi.fn(),
  sendPushToUserMock: vi.fn(),
  isPushConfiguredMock: vi.fn(),
}));

vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/data/budget-data", () => ({ getBudgetsWithProgress: getBudgetsWithProgressMock }));
vi.mock("@/lib/notifications/web-push", () => ({
  sendPushToUser: sendPushToUserMock,
  isPushConfigured: isPushConfiguredMock,
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    pushSubscription: { count: subscriptionCountMock },
    budgetAlertLog: { findMany: alertLogFindManyMock, create: alertLogCreateMock },
  },
}));

const { checkBudgetAlerts } = await import("@/lib/data/budget-alerts");

function budget(id: string, percentUsed: number) {
  return { id, category: id, spent: percentUsed * 5, effectiveLimit: 500, percentUsed };
}

describe("checkBudgetAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isPushConfiguredMock.mockReturnValue(true);
    userFindUniqueMock.mockResolvedValue({ budgetAlertsEnabled: true, preferredCurrency: "CAD" });
    subscriptionCountMock.mockResolvedValue(1);
    alertLogFindManyMock.mockResolvedValue([]);
    alertLogCreateMock.mockResolvedValue({});
    sendPushToUserMock.mockResolvedValue(1);
  });

  it("notifies once per budget that newly crossed a threshold", async () => {
    getBudgetsWithProgressMock.mockResolvedValue([budget("Food", 85), budget("Rent", 40)]);

    expect(await checkBudgetAlerts("user-1")).toBe(1);
    expect(alertLogCreateMock).toHaveBeenCalledWith({ data: { budgetId: "Food", threshold: 80 } });
    expect(sendPushToUserMock).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ title: "Food budget at 85%", url: "/budget", tag: "budget-Food" })
    );
  });

  it("jumping straight past 100% logs both thresholds but sends only the over-budget alert", async () => {
    getBudgetsWithProgressMock.mockResolvedValue([budget("Food", 120)]);

    expect(await checkBudgetAlerts("user-1")).toBe(1);
    expect(alertLogCreateMock).toHaveBeenCalledTimes(2);
    expect(sendPushToUserMock).toHaveBeenCalledTimes(1);
    expect(sendPushToUserMock.mock.calls[0][1].title).toBe("Food is over budget");
  });

  it("skips thresholds that were already sent", async () => {
    getBudgetsWithProgressMock.mockResolvedValue([budget("Food", 90)]);
    alertLogFindManyMock.mockResolvedValue([{ budgetId: "Food", threshold: 80 }]);

    expect(await checkBudgetAlerts("user-1")).toBe(0);
    expect(sendPushToUserMock).not.toHaveBeenCalled();
  });

  it("does not send when a concurrent run already claimed the alert", async () => {
    getBudgetsWithProgressMock.mockResolvedValue([budget("Food", 90)]);
    alertLogCreateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    expect(await checkBudgetAlerts("user-1")).toBe(0);
    expect(sendPushToUserMock).not.toHaveBeenCalled();
  });

  it("does nothing (and logs nothing) without a subscribed device", async () => {
    subscriptionCountMock.mockResolvedValue(0);
    getBudgetsWithProgressMock.mockResolvedValue([budget("Food", 90)]);

    expect(await checkBudgetAlerts("user-1")).toBe(0);
    expect(getBudgetsWithProgressMock).not.toHaveBeenCalled();
    expect(alertLogCreateMock).not.toHaveBeenCalled();
  });

  it("respects the user's alerts setting", async () => {
    userFindUniqueMock.mockResolvedValue({ budgetAlertsEnabled: false, preferredCurrency: "CAD" });
    expect(await checkBudgetAlerts("user-1")).toBe(0);
    expect(getBudgetsWithProgressMock).not.toHaveBeenCalled();
  });

  it("is a no-op when push isn't configured on the server", async () => {
    isPushConfiguredMock.mockReturnValue(false);
    expect(await checkBudgetAlerts("user-1")).toBe(0);
    expect(userFindUniqueMock).not.toHaveBeenCalled();
  });
});
