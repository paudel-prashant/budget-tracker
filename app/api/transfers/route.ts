import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { syncAllFinanceAccountBalances } from "@/lib/data/finance-account-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateTransferBody } from "@/lib/validation/account-validation";

export const runtime = "nodejs";

const RECENT_TRANSFER_LIMIT = 50;

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const transfers = await prisma.transfer.findMany({
      where: { userId: auth.userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: RECENT_TRANSFER_LIMIT,
    });

    return NextResponse.json({
      transfers: transfers.map((transfer) => ({
        id: transfer.id,
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amount: transfer.amount,
        date: transfer.date.toISOString(),
        note: transfer.note,
      })),
    });
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

    const validation = validateTransferBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    const { fromAccountId, toAccountId } = validation.data;
    const ownedCount = await prisma.financeAccount.count({
      where: { userId: auth.userId, id: { in: [fromAccountId, toAccountId] } },
    });

    if (ownedCount !== 2) {
      return jsonError("Account not found", 404);
    }

    const transfer = await prisma.transfer.create({
      data: { ...validation.data, userId: auth.userId },
    });

    await syncAllFinanceAccountBalances(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ id: transfer.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
