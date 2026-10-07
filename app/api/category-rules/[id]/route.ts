import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { validateCategoryRuleBody } from "@/lib/validation/category-rule-validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateCategoryRuleBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    const { pattern, matchType, type } = validation.data;
    const duplicate = await prisma.categoryRule.findFirst({
      where: { userId: auth.userId, pattern, matchType, type, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) {
      return jsonError("Another rule already uses this match", 409);
    }

    const { count } = await prisma.categoryRule.updateMany({
      where: { id, userId: auth.userId },
      data: validation.data,
    });
    if (count === 0) return jsonError("Rule not found", 404);

    return NextResponse.json({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const { count } = await prisma.categoryRule.deleteMany({ where: { id, userId: auth.userId } });
    if (count === 0) return jsonError("Rule not found", 404);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
