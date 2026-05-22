import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  listRecurringTransactions,
  serializeRecurringTransaction,
} from "@/lib/recurring-processor";
import { revalidateFinancePages } from "@/lib/revalidate-pages";
import { validateCreateRecurringTransactionBody } from "@/lib/recurring-validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const recurring = await listRecurringTransactions(auth.userId);
    return NextResponse.json(recurring);
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

    const validation = validateCreateRecurringTransactionBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const recurring = await prisma.recurringTransaction.create({
      data: { ...validation.data, userId: auth.userId },
    });

    revalidateFinancePages();

    return NextResponse.json(serializeRecurringTransaction(recurring), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
