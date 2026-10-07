import { NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/utils/api-utils";
import { listLearnedMappings } from "@/lib/data/category-rules-data";

export const runtime = "nodejs";

/** Title → category pairs learned automatically from the user's saved transactions. */
export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const mappings = await listLearnedMappings(auth.userId);
    return NextResponse.json({ mappings });
  } catch (error) {
    return handleApiError(error);
  }
}
