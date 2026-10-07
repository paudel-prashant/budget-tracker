import { NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { isPushConfigured, sendPushToUser } from "@/lib/notifications/web-push";

export const runtime = "nodejs";

export async function POST() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    if (!isPushConfigured()) {
      return jsonError("Push notifications are not configured on this server", 503);
    }

    const delivered = await sendPushToUser(auth.userId, {
      title: "Budgetrax notifications are on",
      body: "You'll be alerted here when a budget reaches 80% and when it goes over.",
      url: "/settings",
      tag: "test",
    });

    if (delivered === 0) {
      return jsonError("No devices are subscribed to notifications", 404);
    }

    return NextResponse.json({ delivered });
  } catch (error) {
    return handleApiError(error);
  }
}
