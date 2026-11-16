import { NextRequest, NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { getUserPreferredCurrency } from "@/lib/data/user-settings-data";
import { isSupportedCurrency } from "@/lib/currency/constants";
import { fetchGoldPrice } from "@/lib/currency/gold-price";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const currencyParam = new URL(request.url).searchParams.get("currency");
    const currency = currencyParam
      ? isSupportedCurrency(currencyParam)
        ? currencyParam
        : null
      : await getUserPreferredCurrency(auth.userId);

    if (!currency) {
      return jsonError("Invalid currency", 400);
    }

    try {
      return NextResponse.json(await fetchGoldPrice(currency));
    } catch (error) {
      console.error("Gold price fetch failed", error);
      return jsonError("Live gold price is unavailable right now", 502);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
