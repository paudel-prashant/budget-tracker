import { pricePerGram } from "@/lib/domain/gold";

/** Free, keyless spot price feed (XAU per troy ounce, converted to the requested currency). */
export const GOLD_PRICE_API_URL = "https://api.gold-api.com/price/XAU";
export const GOLD_PRICE_PROVIDER = "gold-api.com";

/** Seconds a fetched quote is reused — "live" without hammering the provider. */
export const GOLD_PRICE_REVALIDATE_SECONDS = 60;

export type GoldPriceQuote = {
  currency: string;
  pricePerOunce: number;
  pricePerGram: number;
  /** ISO timestamp of the provider's quote. */
  updatedAt: string;
  provider: string;
};

type GoldApiResponse = {
  currency?: string;
  price?: number;
  updatedAt?: string;
};

export async function fetchGoldPrice(currency: string): Promise<GoldPriceQuote> {
  const response = await fetch(`${GOLD_PRICE_API_URL}/${encodeURIComponent(currency)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: GOLD_PRICE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Gold price request failed (${response.status})`);
  }

  const data = (await response.json()) as GoldApiResponse;
  const price = data.price;

  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new Error("Gold price response was missing a valid price");
  }
  if (data.currency && data.currency.toUpperCase() !== currency.toUpperCase()) {
    throw new Error(`Gold price returned in ${data.currency}, expected ${currency}`);
  }

  return {
    currency: currency.toUpperCase(),
    pricePerOunce: price,
    pricePerGram: pricePerGram(price),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    provider: GOLD_PRICE_PROVIDER,
  };
}
