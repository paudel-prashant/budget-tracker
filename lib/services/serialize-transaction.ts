import type { Transaction as PrismaTransaction, TransactionType as PrismaTransactionType } from "@prisma/client";
import type { TransactionType } from "@/lib/types";

type TransactionRow = Pick<
  PrismaTransaction,
  | "id"
  | "title"
  | "amount"
  | "currency"
  | "baseAmount"
  | "type"
  | "category"
  | "date"
  | "tags"
  | "createdAt"
>;

export function serializeTransaction(row: TransactionRow) {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    currency: row.currency,
    baseAmount: row.baseAmount,
    type: row.type as TransactionType,
    category: row.category,
    date: row.date.toISOString(),
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Amount normalized to the user's preferred currency for totals and charts. */
export function transactionBaseAmount(row: Pick<PrismaTransaction, "baseAmount" | "amount">): number {
  return row.baseAmount ?? row.amount;
}

export type { PrismaTransactionType };
