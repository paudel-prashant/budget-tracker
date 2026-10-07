import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";

export const runtime = "nodejs";

const MAX_KEY_LENGTH = 200;

/** Hides a suggestion (e.g. a detected subscription) for good. */
export async function POST(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const key = body && typeof body === "object" ? (body as Record<string, unknown>).key : undefined;
    if (typeof key !== "string" || key.trim().length === 0 || key.length > MAX_KEY_LENGTH) {
      return jsonError("key is required", 400);
    }

    await prisma.dismissedSuggestion.upsert({
      where: { userId_key: { userId: auth.userId, key } },
      create: { userId: auth.userId, key },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
