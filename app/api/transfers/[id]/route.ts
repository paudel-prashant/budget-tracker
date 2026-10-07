import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { syncAllFinanceAccountBalances } from "@/lib/data/finance-account-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";

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
    const { count } = await prisma.transfer.deleteMany({ where: { id, userId: auth.userId } });

    if (count === 0) return jsonError("Transfer not found", 404);

    await syncAllFinanceAccountBalances(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
