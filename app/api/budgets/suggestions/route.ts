import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { getBudgetSuggestions } from "@/lib/data/budget-data";
import { parseMonthYearSearchParams } from "@/lib/validation/budget-validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const parsed = parseMonthYearSearchParams(request.nextUrl.searchParams);
    if ("error" in parsed) return jsonError(parsed.error, 400);

    const suggestions = await getBudgetSuggestions(auth.userId, parsed.month, parsed.year);

    return NextResponse.json({ month: parsed.month, year: parsed.year, suggestions });
  } catch (error) {
    return handleApiError(error);
  }
}
