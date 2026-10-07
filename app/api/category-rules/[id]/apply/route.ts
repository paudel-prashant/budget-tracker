import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { applyCategoryRuleToExisting } from "@/lib/data/category-rules-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Re-categorizes existing transactions this rule matches. */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const updated = await applyCategoryRuleToExisting(auth.userId, id);
    if (updated === null) return jsonError("Rule not found", 404);

    if (updated > 0) revalidateFinancePages();

    return NextResponse.json({ updated });
  } catch (error) {
    return handleApiError(error);
  }
}
