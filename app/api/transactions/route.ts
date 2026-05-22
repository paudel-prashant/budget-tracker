import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { processRecurringTransactions } from "@/lib/recurring-processor";
import { revalidateFinancePages } from "@/lib/revalidate-pages";
import { upsertLearnedCategoryMapping } from "@/lib/category-mapping-service";
import { validateCreateTransactionBody } from "@/lib/transaction-validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    await processRecurringTransactions(auth.userId);
    const transactions = await prisma.transaction.findMany({
      where: { userId: auth.userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
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

    const validation = validateCreateTransactionBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const transaction = await prisma.transaction.create({
      data: { ...validation.data, userId: auth.userId },
    });

    await upsertLearnedCategoryMapping(
      auth.userId,
      validation.data.title,
      validation.data.category,
      validation.data.type
    );

    revalidateFinancePages();

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
