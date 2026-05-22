import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { listLiabilities, upsertNetWorthSnapshot } from "@/lib/data/net-worth-data";
import { getCurrentMonthKey } from "@/lib/domain/monthly-report";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { validateLiabilityBody } from "@/lib/validation/net-worth-validation";

export const runtime = "nodejs";

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

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const liabilities = await listLiabilities(auth.userId);
    return NextResponse.json(liabilities);
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

    const validation = validateLiabilityBody(body);
    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const liability = await prisma.liability.create({
      data: { ...validation.data, userId: auth.userId },
    });

    await refreshSnapshot(auth.userId);
    revalidateFinancePages();

    return NextResponse.json(liability, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
