import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { ensureBudgetCarryOver } from "@/lib/data/budget-data";
import { isPushConfigured } from "@/lib/notifications/web-push";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateBudgetSettingsBody } from "@/lib/validation/settings-validation";

export const runtime = "nodejs";

const settingsSelect = { budgetCarryOverEnabled: true, budgetAlertsEnabled: true } as const;

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const settings = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: settingsSelect,
    });

    if (!settings) return jsonError("User not found", 404);

    return NextResponse.json({ ...settings, pushConfigured: isPushConfigured() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
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

    const validation = validateBudgetSettingsBody(body);
    if (!validation.success) return jsonError(validation.error, 400);

    const settings = await prisma.user.update({
      where: { id: auth.userId },
      data: validation.data,
      select: settingsSelect,
    });

    // Turning carry-over on mid-month should fill an empty current month right away.
    if (validation.data.budgetCarryOverEnabled) {
      const created = await ensureBudgetCarryOver(auth.userId);
      if (created > 0) revalidateFinancePages();
    }

    return NextResponse.json({ ...settings, pushConfigured: isPushConfigured() });
  } catch (error) {
    return handleApiError(error);
  }
}
