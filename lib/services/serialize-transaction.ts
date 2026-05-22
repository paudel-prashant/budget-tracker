import type { Transaction } from "@prisma/client";
import type { TransactionType } from "@/lib/types";

export function serializeTransaction(row: Transaction) {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    type: row.type as TransactionType,
    category: row.category,
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
