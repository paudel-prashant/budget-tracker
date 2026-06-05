import { NextRequest, NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { getUserPreferredCurrency } from "@/lib/data/user-settings-data";
import { getCachedLatestRates } from "@/lib/currency/exchange-rates";
import { isSupportedCurrency } from "@/lib/currency/constants";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const params = new URL(request.url).searchParams;
    const baseParam = params.get("base");
    const symbolsParam = params.get("symbols");

    const base = baseParam
      ? isSupportedCurrency(baseParam)
        ? baseParam
        : null
      : await getUserPreferredCurrency(auth.userId);

    if (!base) {
      return jsonError("Invalid base currency", 400);
    }

    const symbols =
      symbolsParam?.split(",").filter((code) => isSupportedCurrency(code) && code !== base) ??
      ["USD", "EUR", "GBP", "AUD", "JPY"].filter((code) => code !== base);

    const quote = await getCachedLatestRates(base, symbols.join(","));

    return NextResponse.json({
      ...quote,
      provider: "Frankfurter",
      providerUrl: "https://www.frankfurter.app",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
