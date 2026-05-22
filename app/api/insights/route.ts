import { NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-utils";
import { getFinancialInsights } from "@/lib/insights-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const insights = await getFinancialInsights(auth.userId);
    return NextResponse.json(insights);
  } catch (error) {
    return handleApiError(error);
  }
}
