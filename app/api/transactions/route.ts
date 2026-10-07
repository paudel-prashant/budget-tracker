import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import {
  resolveTransactionAccountId,
  syncFinanceAccountsForUser,
} from "@/lib/data/finance-account-data";
import { scheduleBudgetAlertCheck } from "@/lib/data/budget-alerts";
import { upsertLearnedCategoryMapping } from "@/lib/domain/category-mapping-service";
import {
  buildTransactionWhere,
  parseTransactionListParams,
} from "@/lib/domain/transaction-filters";
import { serializeTransaction } from "@/lib/services/serialize-transaction";
import { buildTransactionWriteData } from "@/lib/currency/transaction-write";
import { validateCreateTransactionBody } from "@/lib/validation/transaction-validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    await processRecurringTransactions(auth.userId);

    const parsed = parseTransactionListParams(new URL(request.url).searchParams);

    if (!parsed.success) {
      return jsonError(parsed.error, 400);
    }

    const { page, pageSize, ...filters } = parsed.params;
    const where = buildTransactionWhere(auth.userId, filters);
    const skip = (page - 1) * pageSize;

    const userScope = { userId: auth.userId };

    const [total, rows, categoryRows, tagRows, totalUnfiltered] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.transaction.findMany({
        where: userScope,
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
      // `tags` is a Postgres array column — Prisma's `distinct` can't unnest it,
      // so distinct tag *values* need a raw query.
      prisma.$queryRaw<Array<{ tag: string }>>(Prisma.sql`
        SELECT DISTINCT unnest("tags") AS tag
        FROM "Transaction"
        WHERE "userId" = ${auth.userId}
        ORDER BY tag ASC
      `),
      prisma.transaction.count({ where: userScope }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return NextResponse.json({
      data: rows.map(serializeTransaction),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      meta: {
        categories: categoryRows.map((row) => row.category),
        tags: tagRows.map((row) => row.tag),
        totalUnfiltered,
      },
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

    const validation = validateCreateTransactionBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    await processRecurringTransactions(auth.userId);
    const financeAccountId = await resolveTransactionAccountId(
      auth.userId,
      validation.data.financeAccountId
    );

    if (!financeAccountId) {
      return jsonError("Account not found", 400);
    }

    const { splits, ...input } = validation.data;
    let created;

    if (splits) {
      // One row per part so every category total, budget and report picks each part
      // up without special-casing; the shared splitGroupId ties them back together.
      const splitGroupId = randomUUID();
      const rows = await Promise.all(
        splits.map((split) =>
          buildTransactionWriteData(auth.userId, {
            ...input,
            amount: split.amount,
            category: split.category,
          })
        )
      );

      created = await prisma.$transaction(
        rows.map((row) =>
          prisma.transaction.create({
            data: { ...row, userId: auth.userId, financeAccountId, splitGroupId },
          })
        )
      );
    } else {
      const writeData = await buildTransactionWriteData(auth.userId, input);
      created = [
        await prisma.transaction.create({
          data: { ...writeData, userId: auth.userId, financeAccountId },
        }),
      ];

      await upsertLearnedCategoryMapping(
        auth.userId,
        validation.data.title,
        validation.data.category,
        validation.data.type
      );
    }

    await syncFinanceAccountsForUser(auth.userId);
    revalidateFinancePages();

    if (validation.data.type === "EXPENSE") {
      scheduleBudgetAlertCheck(auth.userId);
    }

    return NextResponse.json(
      splits
        ? { transactions: created.map(serializeTransaction) }
        : serializeTransaction(created[0]),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
