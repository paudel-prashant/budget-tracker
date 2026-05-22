import { getDueOccurrences, startOfUtcDay } from "@/lib/recurrence-dates";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function processRecurringTransactions(userId: string): Promise<number> {
  assertDatabaseUrl();

  const today = startOfUtcDay(new Date());
  const recurringList = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      startDate: { lte: today },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
  });

  let totalCreated = 0;

  for (const recurring of recurringList) {
    const occurrences = getDueOccurrences(
      recurring.startDate,
      recurring.frequency,
      recurring.lastProcessedAt,
      recurring.endDate
    );

    if (occurrences.length === 0) {
      continue;
    }

    const createResult = await prisma.transaction.createMany({
      data: occurrences.map((occurrenceDate) => ({
        userId,
        title: recurring.title,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        date: occurrenceDate,
        recurringTransactionId: recurring.id,
        occurrenceDate,
      })),
      skipDuplicates: true,
    });

    totalCreated += createResult.count;

    const latestOccurrence = occurrences[occurrences.length - 1];
    const latestProcessed = recurring.lastProcessedAt
      ? startOfUtcDay(recurring.lastProcessedAt)
      : null;

    if (!latestProcessed || latestOccurrence > latestProcessed) {
      await prisma.recurringTransaction.update({
        where: { id: recurring.id },
        data: { lastProcessedAt: latestOccurrence },
      });
    }
  }

  return totalCreated;
}

export function serializeRecurringTransaction(recurring: {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  lastProcessedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: recurring.id,
    title: recurring.title,
    amount: recurring.amount,
    type: recurring.type,
    category: recurring.category,
    frequency: recurring.frequency,
    startDate: recurring.startDate.toISOString(),
    endDate: recurring.endDate?.toISOString() ?? null,
    lastProcessedAt: recurring.lastProcessedAt?.toISOString() ?? null,
    createdAt: recurring.createdAt.toISOString(),
  };
}

export async function listRecurringTransactions(userId: string) {
  await processRecurringTransactions(userId);

  const items = await prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return items.map(serializeRecurringTransaction);
}
