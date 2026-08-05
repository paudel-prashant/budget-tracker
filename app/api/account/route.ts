import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { deleteUserAccount } from "@/lib/data/account-data";

export const runtime = "nodejs";

// Server-side guard against accidental triggers (a stray fetch from devtools,
// a buggy retry, etc.) — the client UI additionally requires typing this
// phrase before the request is ever sent (see danger-zone-section.tsx).
const CONFIRMATION_PHRASE = "DELETE";

export async function DELETE(request: NextRequest) {
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

    const confirm = (body as { confirm?: unknown } | null)?.confirm;
    if (confirm !== CONFIRMATION_PHRASE) {
      return jsonError(`Type "${CONFIRMATION_PHRASE}" to confirm account deletion`, 400);
    }

    await deleteUserAccount(auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
