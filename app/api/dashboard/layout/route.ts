import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import {
  getDashboardLayout,
  saveDashboardLayout,
} from "@/lib/data/dashboard-layout-data";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { revalidatePath } from "next/cache";
import { validateDashboardLayoutBody } from "@/lib/validation/dashboard-layout-validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const layout = await getDashboardLayout(auth.userId);
    return NextResponse.json(layout);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
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

    const validation = validateDashboardLayoutBody(body);
    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const layout = await saveDashboardLayout(auth.userId, validation.data);
    revalidatePath("/");

    return NextResponse.json(layout);
  } catch (error) {
    return handleApiError(error);
  }
}
