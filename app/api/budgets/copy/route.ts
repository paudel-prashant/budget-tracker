import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { copyBudgetsToMonth } from "@/lib/data/budget-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateCopyBudgetsBody } from "@/lib/validation/budget-validation";

export const runtime = "nodejs";

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

    const validation = validateCopyBudgetsBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const { from, to } = validation.data;
    const result = await copyBudgetsToMonth(auth.userId, from, to);

    if (result.created === 0 && result.skipped === 0) {
      return jsonError("No budgets found for the source month", 404);
    }

    if (result.created > 0) {
      revalidateFinancePages();
    }

    return NextResponse.json(result, { status: result.created > 0 ? 201 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
