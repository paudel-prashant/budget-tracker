import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { syncAllFinanceAccountBalances } from "@/lib/data/finance-account-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateBalanceUpdateBody } from "@/lib/validation/account-validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Sets an account's current balance — an investment's market value, or reconciling with a
 * statement. Shifts the opening balance by the difference instead of recording a
 * transaction, so a market gain never shows up as income (or a loss as spending).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateBalanceUpdateBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    const account = await prisma.financeAccount.findFirst({
      where: { id, userId: auth.userId },
      select: { id: true, openingBalance: true },
    });
    if (!account) return jsonError("Account not found", 404);

    // Make sure we adjust from the true current balance, not a stale stored one.
    const balances = await syncAllFinanceAccountBalances(auth.userId);
    const current = balances.get(id) ?? 0;
    const difference = validation.data.balance - current;

    await prisma.financeAccount.update({
      where: { id },
      data: { openingBalance: Math.round((account.openingBalance + difference) * 100) / 100 },
    });

    await syncAllFinanceAccountBalances(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ id, balance: validation.data.balance });
  } catch (error) {
    return handleApiError(error);
  }
}
