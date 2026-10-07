/**
 * An account's balance from its parts. Transfers move money between the user's own
 * accounts, so they change balances but never count as income or spending.
 */
export function computeAccountBalance(parts: {
  openingBalance: number;
  income: number;
  expenses: number;
  transfersIn: number;
  transfersOut: number;
}): number {
  const balance =
    parts.openingBalance + parts.income - parts.expenses + parts.transfersIn - parts.transfersOut;
  return Math.round(balance * 100) / 100;
}
