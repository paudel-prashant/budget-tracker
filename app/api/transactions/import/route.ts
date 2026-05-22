import { NextRequest, NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { computeTransactionImportHash } from "@/lib/transaction-import-hash";
import { upsertLearnedCategoryMapping } from "@/lib/category-mapping-service";
import { normalizeTitleKey } from "@/lib/category-suggestion-engine";
import { revalidateFinancePages } from "@/lib/revalidate-pages";
import { startOfUtcDay } from "@/lib/recurrence-dates";

export const runtime = "nodejs";

const MAX_IMPORT_ROWS = 2000;

type ImportCommitRow = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  importHash: string;
};

function validateCommitRow(row: unknown, index: number): ImportCommitRow | string {
  if (!row || typeof row !== "object") {
    return `Row ${index + 1}: must be an object`;
  }

  const { title, amount, type, category, date, importHash } = row as Record<string, unknown>;

  if (typeof title !== "string" || title.trim().length === 0) {
    return `Row ${index + 1}: invalid title`;
  }

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return `Row ${index + 1}: invalid amount`;
  }

  if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
    return `Row ${index + 1}: invalid type`;
  }

  if (typeof category !== "string" || category.trim().length === 0) {
    return `Row ${index + 1}: invalid category`;
  }

  if (typeof date !== "string" || Number.isNaN(Date.parse(date))) {
    return `Row ${index + 1}: invalid date`;
  }

  if (typeof importHash !== "string" || importHash.trim().length === 0) {
    return `Row ${index + 1}: invalid importHash`;
  }

  const parsedDate = startOfUtcDay(new Date(date));
  const expectedHash = computeTransactionImportHash({
    title: title.trim(),
    amount: Math.round(amount * 100) / 100,
    type,
    category: category.trim(),
    date: parsedDate,
  });

  if (importHash !== expectedHash) {
    return `Row ${index + 1}: importHash does not match row data`;
  }

  return {
    title: title.trim(),
    amount: Math.round(amount * 100) / 100,
    type,
    category: category.trim(),
    date: parsedDate.toISOString(),
    importHash,
  };
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

    if (!body || typeof body !== "object") {
      return jsonError("Request body must be a JSON object", 400);
    }

    const { rows } = body as { rows?: unknown };

    if (!Array.isArray(rows) || rows.length === 0) {
      return jsonError("rows must be a non-empty array", 400);
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return jsonError(`Cannot import more than ${MAX_IMPORT_ROWS} rows at once`, 400);
    }

    const validated: ImportCommitRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const result = validateCommitRow(rows[i], i);

      if (typeof result === "string") {
        errors.push(result);
      } else {
        validated.push(result);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const uniqueByHash = new Map<string, ImportCommitRow>();

    for (const row of validated) {
      uniqueByHash.set(row.importHash, row);
    }

    const uniqueRows = Array.from(uniqueByHash.values());
    const hashes = uniqueRows.map((row) => row.importHash);

    const existing = await prisma.transaction.findMany({
      where: { userId: auth.userId, importHash: { in: hashes } },
      select: { importHash: true },
    });

    const existingHashes = new Set(
      existing.map((row) => row.importHash).filter((hash): hash is string => !!hash)
    );

    const toInsert = uniqueRows.filter((row) => !existingHashes.has(row.importHash));

    if (toInsert.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: uniqueRows.length,
        message: "All rows were duplicates; nothing imported",
      });
    }

    const result = await prisma.transaction.createMany({
      data: toInsert.map((row) => ({
        userId: auth.userId,
        title: row.title,
        amount: row.amount,
        type: row.type,
        category: row.category,
        date: new Date(row.date),
        importHash: row.importHash,
      })),
      skipDuplicates: true,
    });

    if (result.count > 0) {
      const mappingKeys = new Set<string>();

      await Promise.all(
        toInsert.map((row) => {
          const key = `${normalizeTitleKey(row.title)}|${row.type}`;
          if (mappingKeys.has(key)) return Promise.resolve();
          mappingKeys.add(key);
          return upsertLearnedCategoryMapping(
            auth.userId,
            row.title,
            row.category,
            row.type
          );
        })
      );

      revalidateFinancePages();
    }

    return NextResponse.json({
      imported: result.count,
      skipped: uniqueRows.length - result.count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
