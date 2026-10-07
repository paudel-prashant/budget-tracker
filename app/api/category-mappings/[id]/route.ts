import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Forget a learned mapping (it's re-learned if the user saves that title again). */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const { count } = await prisma.categoryMapping.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (count === 0) return jsonError("Mapping not found", 404);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
