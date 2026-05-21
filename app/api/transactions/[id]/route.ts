import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const { id } = await context.params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return jsonError("Transaction id is required", 400);
    }

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonError("Transaction not found", 404);
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
