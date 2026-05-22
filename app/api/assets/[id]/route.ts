import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { upsertNetWorthSnapshot } from "@/lib/data/net-worth-data";
import { getCurrentMonthKey } from "@/lib/domain/monthly-report";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateAssetBody } from "@/lib/validation/net-worth-validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function refreshSnapshot(userId: string) {
  const [assets, liabilities] = await Promise.all([
    prisma.asset.aggregate({ where: { userId }, _sum: { value: true } }),
    prisma.liability.aggregate({ where: { userId }, _sum: { value: true } }),
  ]);
  await upsertNetWorthSnapshot(
    userId,
    getCurrentMonthKey(),
    assets._sum.value ?? 0,
    liabilities._sum.value ?? 0
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await context.params;
    const existing = await prisma.asset.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return jsonError("Asset not found", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateAssetBody(body);
    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: validation.data,
    });

    await refreshSnapshot(auth.userId);
    revalidateFinancePages();

    return NextResponse.json(asset);
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
    const existing = await prisma.asset.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return jsonError("Asset not found", 404);
    }

    await prisma.asset.delete({ where: { id } });
    await refreshSnapshot(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
