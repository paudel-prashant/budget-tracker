import { TransactionType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { detectSubscriptions, type DetectedSuggestion } from "@/lib/domain/subscription-detection";

/** Enough history to see a yearly charge twice. */
const HISTORY_DAYS = 400;

export async function getSubscriptionSuggestions(userId: string): Promise<DetectedSuggestion[]> {
  assertDatabaseUrl();

  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000);

  const [charges, recurring, dismissed] = await Promise.all([
    prisma.transaction.findMany({
      // Transactions the recurring processor generated are already tracked.
      where: { userId, type: TransactionType.EXPENSE, recurringTransactionId: null, date: { gte: since } },
      select: { title: true, baseAmount: true, date: true, category: true },
    }),
    prisma.recurringTransaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      select: { id: true, title: true, amount: true, frequency: true },
    }),
    prisma.dismissedSuggestion.findMany({ where: { userId }, select: { key: true } }),
  ]);

  const dismissedKeys = new Set(dismissed.map((row) => row.key));

  return detectSubscriptions(
    charges.map((charge) => ({
      title: charge.title,
      amount: charge.baseAmount,
      date: charge.date,
      category: charge.category,
    })),
    recurring
  ).filter((suggestion) => !dismissedKeys.has(suggestion.key));
}
