import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import {
  listFinanceAccounts,
  syncAllFinanceAccountBalances,
} from "@/lib/data/finance-account-data";
import { getUserPreferredCurrency } from "@/lib/data/user-settings-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateAccountBody } from "@/lib/validation/account-validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const accounts = await listFinanceAccounts(auth.userId);
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateAccountBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    // Balances are tracked in the user's preferred currency, like transaction baseAmount.
    const currency = await getUserPreferredCurrency(auth.userId);

    const account = await prisma.financeAccount.create({
      data: {
        ...validation.data,
        currentBalance: validation.data.openingBalance,
        currency,
        userId: auth.userId,
      },
    });

    await syncAllFinanceAccountBalances(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ id: account.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
