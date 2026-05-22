import { NextRequest, NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { getMonthlyReport } from "@/lib/data/monthly-report-data";
import { parseMonthKey } from "@/lib/domain/monthly-report";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const month = new URL(request.url).searchParams.get("month");
    if (month && !parseMonthKey(month)) {
      return jsonError("month must be in YYYY-MM format", 400);
    }

    const payload = await getMonthlyReport(auth.userId, month);
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
