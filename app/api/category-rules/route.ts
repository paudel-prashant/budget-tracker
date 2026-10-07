import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { listCategoryRules } from "@/lib/data/category-rules-data";
import { validateCategoryRuleBody } from "@/lib/validation/category-rule-validation";

export const runtime = "nodejs";

const MAX_RULES_PER_USER = 200;

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const rules = await listCategoryRules(auth.userId);
    return NextResponse.json({ rules });
  } catch (error) {
    return handleApiError(error);
  }
}

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

    const validation = validateCategoryRuleBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    const { pattern, matchType, type } = validation.data;
    const [count, duplicate] = await Promise.all([
      prisma.categoryRule.count({ where: { userId: auth.userId } }),
      prisma.categoryRule.findFirst({
        where: { userId: auth.userId, pattern, matchType, type },
        select: { id: true },
      }),
    ]);

    if (duplicate) {
      return jsonError("A rule with the same match already exists — edit that one instead", 409);
    }
    if (count >= MAX_RULES_PER_USER) {
      return jsonError(`You can have up to ${MAX_RULES_PER_USER} rules`, 400);
    }

    const rule = await prisma.categoryRule.create({
      data: { ...validation.data, userId: auth.userId },
    });

    return NextResponse.json({ id: rule.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
