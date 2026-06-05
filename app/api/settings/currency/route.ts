import { NextRequest, NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/auth/api-auth";
import {
  getUserCurrencySettings,
  setUserPreferredCurrency,
} from "@/lib/data/user-settings-data";
import { isSupportedCurrency } from "@/lib/currency/constants";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const settings = await getUserCurrencySettings(auth.userId);
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const preferredCurrency =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).preferredCurrency
        : undefined;

    if (typeof preferredCurrency !== "string" || !isSupportedCurrency(preferredCurrency)) {
      return jsonError("preferredCurrency must be a supported ISO currency code", 400);
    }

    const saved = await setUserPreferredCurrency(auth.userId, preferredCurrency);
    revalidateFinancePages();

    const settings = await getUserCurrencySettings(auth.userId);
    return NextResponse.json({ ...settings, preferredCurrency: saved });
  } catch (error) {
    return handleApiError(error);
  }
}
