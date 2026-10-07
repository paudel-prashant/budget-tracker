import { NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/utils/api-utils";
import { getBudgetHistory } from "@/lib/data/budget-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const history = await getBudgetHistory(auth.userId);

    return NextResponse.json({ history });
  } catch (error) {
    return handleApiError(error);
  }
}
