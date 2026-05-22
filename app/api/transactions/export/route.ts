import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { buildCsvContent, CSV_EXPORT_HEADERS } from "@/lib/csv-utils";
import { startOfUtcDay } from "@/lib/recurrence-dates";

export const runtime = "nodejs";

function parseOptionalDate(
  value: string | null,
  label: string
): { date: Date | null; error: string | null } {
  if (!value) {
    return { date: null, error: null };
  }

  if (Number.isNaN(Date.parse(value))) {
    return { date: null, error: `${label} must be a valid ISO date` };
  }

  return { date: startOfUtcDay(new Date(value)), error: null };
}

export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { searchParams } = request.nextUrl;
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    const startParsed = parseOptionalDate(startParam, "startDate");
    const endParsed = parseOptionalDate(endParam, "endDate");

    if (startParsed.error) {
      return jsonError(startParsed.error, 400);
    }
    if (endParsed.error) {
      return jsonError(endParsed.error, 400);
    }

    const startDate = startParsed.date;
    const endDate = endParsed.date;

    if (startDate && endDate && startDate > endDate) {
      return jsonError("startDate cannot be after endDate", 400);
    }

    const dateFilter: { gte?: Date; lt?: Date } = {};

    if (startDate) {
      dateFilter.gte = startDate;
    }

    if (endDate) {
      const endExclusive = new Date(endDate);
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      dateFilter.lt = endExclusive;
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    const csvRows = transactions.map((transaction) => [
      transaction.title,
      String(transaction.amount),
      transaction.type,
      transaction.category,
      startOfUtcDay(transaction.date).toISOString().slice(0, 10),
      transaction.createdAt.toISOString(),
    ]);

    const csv = buildCsvContent([...CSV_EXPORT_HEADERS], csvRows);
    const filenameDate = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${filenameDate}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
