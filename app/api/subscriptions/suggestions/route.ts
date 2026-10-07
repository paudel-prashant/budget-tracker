import { NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/utils/api-utils";
import { getSubscriptionSuggestions } from "@/lib/data/subscription-data";

export const runtime = "nodejs";

/** Detected subscriptions to track and price increases on tracked ones. */
export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const suggestions = await getSubscriptionSuggestions(auth.userId);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return handleApiError(error);
  }
}
