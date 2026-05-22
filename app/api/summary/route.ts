import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const userWhere = { userId: auth.userId };

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...userWhere, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...userWhere, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeResult._sum.amount ?? 0;
    const totalExpenses = expenseResult._sum.amount ?? 0;
    const netBalance = totalIncome - totalExpenses;

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netBalance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
