import type { Transaction } from "@/lib/types";

/** Normalized amount in the user's preferred currency for charts and totals. */
export function amountForTotals(
  transaction: Pick<Transaction, "amount" | "baseAmount">
): number {
  return transaction.baseAmount ?? transaction.amount;
}
