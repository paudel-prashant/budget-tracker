import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { getBudgetsWithProgress } from "@/lib/data/budget-data";
import { getCurrentMonthYear } from "@/lib/domain/budget-calculations";
import {
  getBudgetAlertMessage,
  getCrossedAlertThresholds,
} from "@/lib/domain/budget-alerts";
import { sendPushToUser, isPushConfigured } from "@/lib/notifications/web-push";
import { reportError } from "@/lib/utils/logger";

/**
 * Sends a push notification the first time a current-month budget crosses 80% and again
 * when it goes over 100%. Each (budget, threshold) pair is recorded in BudgetAlertLog so
 * it's only ever sent once — even if this runs concurrently or many times a day.
 *
 * Returns the number of notifications sent.
 */
export async function checkBudgetAlerts(userId: string): Promise<number> {
  assertDatabaseUrl();
  if (!isPushConfigured()) return 0;

  const [user, subscriptionCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { budgetAlertsEnabled: true, preferredCurrency: true } }),
    prisma.pushSubscription.count({ where: { userId } }),
  ]);

  // No device to notify: don't log anything, so alerts still fire once one subscribes.
  if (!user?.budgetAlertsEnabled || subscriptionCount === 0) return 0;

  const { month, year } = getCurrentMonthYear();
  const budgets = await getBudgetsWithProgress(userId, month, year);
  const crossed = budgets.filter((budget) => getCrossedAlertThresholds(budget.percentUsed).length > 0);

  if (crossed.length === 0) return 0;

  const logs = await prisma.budgetAlertLog.findMany({
    where: { budgetId: { in: crossed.map((budget) => budget.id) } },
    select: { budgetId: true, threshold: true },
  });
  const alreadySent = new Set(logs.map((log) => `${log.budgetId}:${log.threshold}`));

  let sent = 0;

  for (const budget of crossed) {
    const pending = getCrossedAlertThresholds(budget.percentUsed).filter(
      (threshold) => !alreadySent.has(`${budget.id}:${threshold}`)
    );
    if (pending.length === 0) continue;

    // Record every crossed threshold (a jump straight past 100% also marks 80% as done),
    // but notify only once, for the highest. A unique-constraint error means another run
    // claimed it first — that run sends the notification.
    let claimed = false;
    for (const threshold of pending) {
      try {
        await prisma.budgetAlertLog.create({ data: { budgetId: budget.id, threshold } });
        claimed = true;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
          throw error;
        }
      }
    }

    if (!claimed) continue;

    const message = getBudgetAlertMessage(budget, Math.max(...pending), user.preferredCurrency);
    await sendPushToUser(userId, {
      ...message,
      url: "/budget",
      tag: `budget-${budget.id}`,
    });
    sent += 1;
  }

  return sent;
}

/**
 * Checks alerts after the current response has been sent, so saving a transaction never
 * waits on push delivery. Only callable inside a request (route handler / server action).
 */
export function scheduleBudgetAlertCheck(userId: string) {
  after(async () => {
    try {
      await checkBudgetAlerts(userId);
    } catch (error) {
      reportError("Failed to check budget alerts", error, { scope: "budget-alerts", userId });
    }
  });
}
