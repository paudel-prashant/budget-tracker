import { NextRequest, NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { getDashboardMetrics } from "@/lib/data/dashboard-metrics-data";
import { parseDashboardMetricsSearchParams } from "@/lib/domain/dashboard-date-range";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const parsed = parseDashboardMetricsSearchParams(new URL(request.url).searchParams);

    if (!parsed.success) {
      return jsonError(parsed.error, 400);
    }

    const metrics = await getDashboardMetrics(auth.userId, parsed.range);
    return NextResponse.json(metrics);
  } catch (error) {
    return handleApiError(error);
  }
}
