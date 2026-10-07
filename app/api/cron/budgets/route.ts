import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { ensureBudgetCarryOver } from "@/lib/data/budget-data";
import { checkBudgetAlerts } from "@/lib/data/budget-alerts";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { reportError } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily budget maintenance via Vercel Cron (see vercel.json), scheduled after
 * process-recurring so that day's recurring expenses count toward alerts:
 *   1. carry budgets into the new month for users who never open the app that month;
 *   2. send budget alerts for spending that arrived without a user action (imports,
 *      recurring transactions). Interactive edits already alert immediately.
 * Both steps are idempotent, so the lazy in-app calls and this job never double up.
 */
export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();

    if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
      return jsonError("Unauthorized", 401);
    }

    const [usersWithBudgets, usersWithPush] = await Promise.all([
      prisma.budget.findMany({ select: { userId: true }, distinct: ["userId"] }),
      prisma.pushSubscription.findMany({ select: { userId: true }, distinct: ["userId"] }),
    ]);

    let budgetsCarriedOver = 0;
    let alertsSent = 0;
    let failedUserCount = 0;

    // Sequential for the same connection-budget reason as process-recurring.
    for (const { userId } of usersWithBudgets) {
      try {
        budgetsCarriedOver += await ensureBudgetCarryOver(userId);
      } catch (error) {
        failedUserCount += 1;
        reportError("Failed to carry over budgets for user", error, { scope: "cron", userId });
      }
    }

    for (const { userId } of usersWithPush) {
      try {
        alertsSent += await checkBudgetAlerts(userId);
      } catch (error) {
        failedUserCount += 1;
        reportError("Failed to check budget alerts for user", error, { scope: "cron", userId });
      }
    }

    if (budgetsCarriedOver > 0) {
      revalidateFinancePages();
    }

    return NextResponse.json({ budgetsCarriedOver, alertsSent, failedUserCount });
  } catch (error) {
    return handleApiError(error);
  }
}
