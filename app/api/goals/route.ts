import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { serializeGoal } from "@/lib/services/serialize-goal";
import { validateGoalBody } from "@/lib/validation/goal-validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const goals = await prisma.goal.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals.map(serializeGoal));
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

    const validation = validateGoalBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const goal = await prisma.goal.create({
      data: { ...validation.data, userId: auth.userId },
    });

    revalidateFinancePages();

    return NextResponse.json(serializeGoal(goal), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
