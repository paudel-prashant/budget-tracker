import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { syncFinanceAccountsForUser } from "@/lib/data/finance-account-data";
import { computeTransactionImportHash } from "@/lib/domain/transaction-import-hash";
import { buildTransactionWriteData } from "@/lib/currency/transaction-write";
import { upsertLearnedCategoryMapping } from "@/lib/domain/category-mapping-service";
import { serializeTransaction } from "@/lib/services/serialize-transaction";
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

    const writeData = await buildTransactionWriteData(auth.userId, validation.data);

    const importHash = computeTransactionImportHash({
      title: writeData.title,
      amount: writeData.amount,
      type: writeData.type,
      category: writeData.category,
      date: writeData.date,
    });

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...writeData,
        importHash,
      },
    });

    await upsertLearnedCategoryMapping(
      auth.userId,
      validation.data.title,
      validation.data.category,
      validation.data.type
    );

    await syncFinanceAccountsForUser(auth.userId);
    revalidateFinancePages();

    return NextResponse.json(serializeTransaction(transaction));
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

    await syncFinanceAccountsForUser(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
