import { createHash } from "crypto";
import { TransactionType } from "@prisma/client";
import { startOfUtcDay } from "@/lib/recurrence-dates";

export type TransactionFingerprint = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
};

export function normalizeTransactionFingerprint(
  input: TransactionFingerprint
): TransactionFingerprint {
  return {
    title: input.title.trim().toLowerCase(),
    amount: Math.round(input.amount * 100) / 100,
    type: input.type,
    category: input.category.trim().toLowerCase(),
    date: startOfUtcDay(input.date),
  };
}

export function computeTransactionImportHash(input: TransactionFingerprint): string {
  const normalized = normalizeTransactionFingerprint(input);
  const payload = [
    normalized.title,
    normalized.amount.toFixed(2),
    normalized.type,
    normalized.category,
    normalized.date.toISOString(),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}
