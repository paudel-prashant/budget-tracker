import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { reportError } from "@/lib/utils/logger";

export const runtime = "nodejs";
// Give this more headroom than the default 10s — it loops over every user
// with a recurring transaction, sequentially, on purpose (see comment below).
export const maxDuration = 60;

/**
 * Runs daily via Vercel Cron (see vercel.json) so recurring transactions post even if
 * nobody opens the app that day. This duplicates nothing business-logic-wise — it's a
 * thin scheduler around the same `processRecurringTransactions` the app already calls
 * lazily on page load (see lib/domain/recurring-processor.ts), so behavior stays
 * identical either way; this just removes the "someone has to open the app" dependency.
 */
export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();

    if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
      return jsonError("Unauthorized", 401);
    }

    const usersWithRecurring = await prisma.recurringTransaction.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    let usersProcessed = 0;
    let transactionsCreated = 0;
    let failedUserCount = 0;

    // Sequential, not Promise.all: this runs on a free-tier Postgres instance with a
    // limited connection budget, and a daily cron has no latency pressure to justify
    // fanning out concurrent connections.
    for (const { userId } of usersWithRecurring) {
      try {
        transactionsCreated += await processRecurringTransactions(userId);
        usersProcessed += 1;
      } catch (error) {
        failedUserCount += 1;
        reportError("Failed to process recurring transactions for user", error, {
          scope: "cron",
          userId,
        });
      }
    }

    if (transactionsCreated > 0) {
      revalidateFinancePages();
    }

    return NextResponse.json({
      usersProcessed,
      transactionsCreated,
      failedUserCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
