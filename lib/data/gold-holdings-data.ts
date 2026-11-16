import { prisma } from "@/lib/db/prisma";
import { getUserPreferredCurrency } from "@/lib/data/user-settings-data";
import { fetchGoldPrice, type GoldPriceQuote } from "@/lib/currency/gold-price";
import { goldHoldingValue } from "@/lib/domain/gold";

/** Live quote in the user's preferred currency, or null if the feed is down. */
export async function getGoldQuoteForUser(userId: string): Promise<GoldPriceQuote | null> {
  try {
    const currency = await getUserPreferredCurrency(userId);
    return await fetchGoldPrice(currency);
  } catch (error) {
    console.error("Gold price unavailable", error);
    return null;
  }
}

/**
 * Re-prices every gold holding at the live spot price. Only rows whose value actually
 * moved are written. If the price feed is unavailable, the last stored values stand.
 */
export async function revalueGoldAssets(userId: string): Promise<void> {
  const holdings = await prisma.asset.findMany({
    where: { userId, goldGrams: { not: null }, goldPurity: { not: null } },
    select: { id: true, value: true, goldGrams: true, goldPurity: true },
  });
  if (holdings.length === 0) return;

  const quote = await getGoldQuoteForUser(userId);
  if (!quote) return;

  const asOfDate = new Date(quote.updatedAt);
  const updates = holdings
    .map((holding) => ({
      id: holding.id,
      previous: holding.value,
      next: goldHoldingValue(holding.goldGrams!, holding.goldPurity!, quote.pricePerOunce),
    }))
    .filter((row) => Math.abs(row.next - row.previous) >= 0.01);

  if (updates.length === 0) return;

  await prisma.$transaction(
    updates.map((row) =>
      prisma.asset.update({
        where: { id: row.id },
        data: {
          value: row.next,
          asOfDate: Number.isNaN(asOfDate.getTime()) ? new Date() : asOfDate,
        },
      })
    )
  );
}

/** Value to store for a gold holding being saved: live price if available, else the client's. */
export async function priceGoldInput<T extends { value: number; asOfDate: Date; goldGrams: number | null; goldPurity: number | null }>(
  userId: string,
  input: T
): Promise<T> {
  if (input.goldGrams === null || input.goldPurity === null) return input;

  const quote = await getGoldQuoteForUser(userId);
  if (!quote) return input;

  return {
    ...input,
    value: goldHoldingValue(input.goldGrams, input.goldPurity, quote.pricePerOunce),
    asOfDate: new Date(),
  };
}
