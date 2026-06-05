import { unstable_cache } from "next/cache";
import { FRANKFURTER_API_URL, isSupportedCurrency } from "@/lib/currency/constants";

export type ExchangeRateQuote = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

function formatRateDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchFrankfurter(url: string): Promise<FrankfurterResponse> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Exchange rate request failed (${response.status})`);
  }

  return response.json() as Promise<FrankfurterResponse>;
}

/** Latest ECB-backed rates from Frankfurter (updated on business days). */
export async function fetchLatestRates(
  base: string,
  symbols: string[]
): Promise<ExchangeRateQuote> {
  const targets = [...new Set(symbols.filter((code) => code !== base))];
  if (targets.length === 0) {
    return { base, date: formatRateDate(new Date()), rates: {} };
  }

  const params = new URLSearchParams({ from: base, to: targets.join(",") });
  const data = await fetchFrankfurter(`${FRANKFURTER_API_URL}/latest?${params.toString()}`);

  return {
    base: data.base,
    date: data.date,
    rates: data.rates,
  };
}

/** Historical rate for a specific date (Frankfurter uses nearest available ECB date). */
export async function fetchHistoricalRate(
  from: string,
  to: string,
  date: Date
): Promise<{ rate: number; date: string }> {
  if (from === to) {
    return { rate: 1, date: formatRateDate(date) };
  }

  const dateKey = formatRateDate(date);
  const params = new URLSearchParams({ from, to });
  const data = await fetchFrankfurter(`${FRANKFURTER_API_URL}/${dateKey}?${params.toString()}`);
  const rate = data.rates[to];

  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error(`No exchange rate from ${from} to ${to} on ${dateKey}`);
  }

  return { rate, date: data.date };
}

export async function getExchangeRate(from: string, to: string, date: Date = new Date()): Promise<number> {
  if (from === to) return 1;

  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
    throw new Error(`Unsupported currency pair: ${from} → ${to}`);
  }

  const today = formatRateDate(new Date());
  const targetDate = formatRateDate(date);

  if (targetDate >= today) {
    const latest = await fetchLatestRates(from, [to]);
    const rate = latest.rates[to];
    if (typeof rate !== "number") {
      throw new Error(`No latest rate from ${from} to ${to}`);
    }
    return rate;
  }

  const historical = await fetchHistoricalRate(from, to, date);
  return historical.rate;
}

export const getCachedLatestRates = unstable_cache(
  async (base: string, symbolsKey: string) => {
    const symbols = symbolsKey.split(",").filter(Boolean);
    return fetchLatestRates(base, symbols);
  },
  ["frankfurter-latest-rates"],
  { revalidate: 3600 }
);
