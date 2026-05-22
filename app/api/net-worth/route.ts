import { NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { getNetWorthDashboardData } from "@/lib/data/net-worth-data";
import { handleApiError } from "@/lib/utils/api-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const data = await getNetWorthDashboardData(auth.userId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
