import { NextRequest, NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { getCashFlowForecast } from "@/lib/data/forecast-data";
import { isForecastTimeframe } from "@/lib/forecasting";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const timeframe = request.nextUrl.searchParams.get("timeframe") ?? "30d";

    if (!isForecastTimeframe(timeframe)) {
      return jsonError("Invalid timeframe. Use 7d, 30d, 90d, or 180d.", 400);
    }

    const forecast = await getCashFlowForecast(auth.userId, timeframe);
    return NextResponse.json(forecast);
  } catch (error) {
    return handleApiError(error);
  }
}
