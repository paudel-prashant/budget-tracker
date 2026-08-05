import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateUpdateBudgetBody } from "@/lib/validation/budget-validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedBudget(userId: string, id: string) {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return { error: jsonError("Budget id is required", 400) as Response };
  }

  const existing = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { error: jsonError("Budget not found", 404) as Response };
  }

  return { budget: existing };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const owned = await getOwnedBudget(auth.userId, id);
    if ("error" in owned && owned.error) return owned.error;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    // Only monthlyLimit/rolloverEnabled are editable — category/month/year identify
    // which budget this is, not something you "edit" (see validateUpdateBudgetBody).
    const validation = validateUpdateBudgetBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: validation.data,
    });

    revalidateFinancePages();

    return NextResponse.json(budget);
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
    const owned = await getOwnedBudget(auth.userId, id);
    if ("error" in owned && owned.error) return owned.error;

    await prisma.budget.delete({
      where: { id },
    });

    revalidateFinancePages();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
