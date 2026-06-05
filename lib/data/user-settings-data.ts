import { assertDatabaseUrl } from "@/lib/config/env";
import { normalizeCurrencyCode } from "@/lib/currency/constants";
import { resolveTransactionBaseAmount } from "@/lib/currency/convert";
import { getCachedLatestRates } from "@/lib/currency/exchange-rates";
import { prisma } from "@/lib/db/prisma";

export async function getUserPreferredCurrency(userId: string): Promise<string> {
  assertDatabaseUrl();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredCurrency: true },
  });

  return normalizeCurrencyCode(user?.preferredCurrency);
}

export async function getUserCurrencySettings(userId: string) {
  const preferredCurrency = await getUserPreferredCurrency(userId);
  const popularTargets = ["USD", "EUR", "GBP", "AUD", "JPY"].filter((c) => c !== preferredCurrency);
  const quote = await getCachedLatestRates(preferredCurrency, popularTargets.join(","));

  return {
    preferredCurrency,
    rates: quote,
    provider: "Frankfurter",
    providerUrl: "https://www.frankfurter.app",
  };
}

export async function setUserPreferredCurrency(userId: string, currency: string) {
  assertDatabaseUrl();
  const normalized = normalizeCurrencyCode(currency);

  await prisma.user.update({
    where: { id: userId },
    data: { preferredCurrency: normalized },
  });

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: { id: true, amount: true, currency: true, date: true },
  });

  await Promise.all(
    transactions.map(async (tx) => {
      const baseAmount = await resolveTransactionBaseAmount({
        amount: tx.amount,
        currency: tx.currency,
        preferredCurrency: normalized,
        date: tx.date,
      });

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { baseAmount },
      });
    })
  );

  return normalized;
}
