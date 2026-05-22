import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { getBudgetsWithProgress } from "@/lib/budget-data";
import {
  parseMonthYearSearchParams,
  validateCreateBudgetBody,
} from "@/lib/budget-validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const parsed = parseMonthYearSearchParams(request.nextUrl.searchParams);

    if ("error" in parsed) {
      return jsonError(parsed.error, 400);
    }

    const budgets = await getBudgetsWithProgress(
      auth.userId,
      parsed.month,
      parsed.year
    );

    return NextResponse.json({
      month: parsed.month,
      year: parsed.year,
      budgets,
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

    const validation = validateCreateBudgetBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const budget = await prisma.budget.create({
      data: { ...validation.data, userId: auth.userId },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
