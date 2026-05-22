import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { suggestCategoryForUser } from "@/lib/domain/category-mapping-service";
import type { TransactionType } from "@/lib/types";

export const runtime = "nodejs";

function parseTransactionType(value: string | null): TransactionType | null {
  if (value === "INCOME" || value === "EXPENSE") return value;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.trim() ?? "";
    const type = parseTransactionType(searchParams.get("type"));

    if (!title) {
      return NextResponse.json({ suggestion: null });
    }

    if (!type) {
      return jsonError("Query param type must be INCOME or EXPENSE", 400);
    }

    const suggestion = await suggestCategoryForUser(auth.userId, title, type);

    return NextResponse.json({ suggestion });
  } catch (error) {
    return handleApiError(error);
  }
}
