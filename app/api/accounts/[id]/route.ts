import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import {
  ensureDefaultFinanceAccount,
  syncAllFinanceAccountBalances,
} from "@/lib/data/finance-account-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateAccountBody } from "@/lib/validation/account-validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedAccount(userId: string, id: string) {
  const existing = await prisma.financeAccount.findFirst({ where: { id, userId } });
  if (!existing) {
    return { error: jsonError("Account not found", 404) as Response };
  }
  return { account: existing };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const owned = await getOwnedAccount(auth.userId, id);
    if ("error" in owned && owned.error) return owned.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateAccountBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    await prisma.financeAccount.update({ where: { id }, data: validation.data });
    await syncAllFinanceAccountBalances(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Only empty accounts can be deleted. Silently moving or deleting an account's history
 * would change other balances and past reports, so the user has to do that explicitly.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const owned = await getOwnedAccount(auth.userId, id);
    if ("error" in owned && owned.error) return owned.error;

    const primary = await ensureDefaultFinanceAccount(auth.userId);
    if (primary.id === id) {
      return jsonError("The primary account can't be deleted", 409);
    }

    const [transactionCount, transferCount] = await Promise.all([
      prisma.transaction.count({ where: { userId: auth.userId, financeAccountId: id } }),
      prisma.transfer.count({
        where: { userId: auth.userId, OR: [{ fromAccountId: id }, { toAccountId: id }] },
      }),
    ]);

    if (transactionCount > 0 || transferCount > 0) {
      return jsonError(
        `This account still has ${transactionCount} transaction(s) and ${transferCount} transfer(s). Move or delete them first.`,
        409
      );
    }

    await prisma.financeAccount.delete({ where: { id } });
    revalidateFinancePages();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
