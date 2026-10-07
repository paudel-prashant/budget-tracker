import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { validatePushSubscriptionBody } from "@/lib/validation/settings-validation";

export const runtime = "nodejs";

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Registers (or re-registers) this browser for push notifications. */
export async function POST(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid JSON body", 400);

    const validation = validatePushSubscriptionBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    const { endpoint, p256dh, auth: authKey } = validation.data;

    // Endpoints are unique per browser; if another account on this device subscribed
    // earlier, the subscription now belongs to whoever is signed in.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh, auth: authKey, userId: auth.userId },
      update: { p256dh, auth: authKey, userId: auth.userId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const body = await readJson(request);
    const endpoint =
      body && typeof body === "object" ? (body as Record<string, unknown>).endpoint : undefined;

    if (typeof endpoint !== "string" || endpoint.length === 0) {
      return jsonError("endpoint is required", 400);
    }

    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: auth.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
