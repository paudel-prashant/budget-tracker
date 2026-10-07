import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import { getBillsCalendar } from "@/lib/data/bills-calendar-data";
import { parseMonthYearSearchParams } from "@/lib/validation/budget-validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const parsed = parseMonthYearSearchParams(request.nextUrl.searchParams);
    if ("error" in parsed) return jsonError(parsed.error, 400);

    // Post anything due first so the projected balance starts from the real one.
    await processRecurringTransactions(auth.userId);

    const calendar = await getBillsCalendar(auth.userId, parsed.month, parsed.year);
    return NextResponse.json(calendar);
  } catch (error) {
    return handleApiError(error);
  }
}
