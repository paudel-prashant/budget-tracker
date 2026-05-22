import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { computeTransactionImportHash } from "@/lib/domain/transaction-import-hash";
import { upsertLearnedCategoryMapping } from "@/lib/domain/category-mapping-service";
import { validateTransactionBody } from "@/lib/validation/transaction-validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedTransaction(userId: string, id: string) {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return { error: jsonError("Transaction id is required", 400) as Response };
  }

  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { error: jsonError("Transaction not found", 404) as Response };
  }

  return { transaction: existing };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const owned = await getOwnedTransaction(auth.userId, id);
    if ("error" in owned && owned.error) return owned.error;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateTransactionBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const importHash = computeTransactionImportHash({
      title: validation.data.title,
      amount: validation.data.amount,
      type: validation.data.type,
      category: validation.data.category,
      date: validation.data.date,
    });

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        title: validation.data.title,
        amount: validation.data.amount,
        type: validation.data.type,
        category: validation.data.category,
        date: validation.data.date,
        importHash,
      },
    });

    await upsertLearnedCategoryMapping(
      auth.userId,
      validation.data.title,
      validation.data.category,
      validation.data.type
    );

    revalidateFinancePages();

    return NextResponse.json(transaction);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const owned = await getOwnedTransaction(auth.userId, id);
    if ("error" in owned && owned.error) return owned.error;

    await prisma.transaction.delete({
      where: { id },
    });

    revalidateFinancePages();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
