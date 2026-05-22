import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return jsonError("Budget id is required", 400);
    }

    const existing = await prisma.budget.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return jsonError("Budget not found", 404);
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
