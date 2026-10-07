import type { FinanceAccountType } from "@/lib/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * How an account counts toward net worth. A positive balance is something you own; a
 * negative one (credit card owing, overdrawn chequing) is something you owe.
 */
export function accountNetWorthContribution(balance: number): { asset: number; liability: number } {
  return balance >= 0
    ? { asset: roundMoney(balance), liability: 0 }
    : { asset: 0, liability: roundMoney(-balance) };
}

/** Money you can spend day to day — investment accounts (TFSA, RRSP) aren't cash flow. */
export function isLiquidAccountType(type: FinanceAccountType): boolean {
  return type !== "INVESTMENT";
}

/** Suggested account type when moving a manual net-worth item onto the Accounts page. */
export function suggestAccountTypeForNetWorthItem(
  kind: "asset" | "liability",
  category: string
): FinanceAccountType | null {
  if (kind === "liability") return category === "Credit Card" ? "CREDIT" : null;
  if (category === "Cash") return "SAVINGS";
  if (category === "Investments" || category === "Retirement") return "INVESTMENT";
  return null;
}

/** Common guidance: under 30% is healthy, 30–50% is worth watching, above 50% hurts credit. */
export const UTILIZATION_FAIR_THRESHOLD = 30;
export const UTILIZATION_HIGH_THRESHOLD = 50;

export type UtilizationLevel = "good" | "fair" | "high";

export function utilizationLevel(percent: number): UtilizationLevel {
  if (percent >= UTILIZATION_HIGH_THRESHOLD) return "high";
  if (percent >= UTILIZATION_FAIR_THRESHOLD) return "fair";
  return "good";
}

export type CreditCardUtilization = {
  id: string;
  name: string;
  owed: number;
  creditLimit: number | null;
  available: number | null;
  /** owed / limit as a percentage; null without a limit. */
  utilization: number | null;
};

export type CreditCardSummary = {
  cards: CreditCardUtilization[];
  totalOwed: number;
  /** Sum of limits of cards that have one. */
  totalLimit: number;
  /** Owed on cards with a limit ÷ their total limit — what credit bureaus look at. */
  overallUtilization: number | null;
};

export function summarizeCreditCards(
  cards: Array<{ id: string; name: string; currentBalance: number; creditLimit: number | null }>
): CreditCardSummary {
  const summarized = cards.map((card) => {
    const owed = roundMoney(Math.max(0, -card.currentBalance));
    const limit = card.creditLimit && card.creditLimit > 0 ? card.creditLimit : null;
    return {
      id: card.id,
      name: card.name,
      owed,
      creditLimit: limit,
      available: limit === null ? null : roundMoney(Math.max(0, limit - owed)),
      utilization: limit === null ? null : Math.round((owed / limit) * 1000) / 10,
    };
  });

  const withLimit = summarized.filter((card) => card.creditLimit !== null);
  const totalLimit = roundMoney(withLimit.reduce((sum, card) => sum + card.creditLimit!, 0));
  const owedWithLimit = withLimit.reduce((sum, card) => sum + card.owed, 0);

  return {
    cards: summarized.sort((a, b) => (b.utilization ?? -1) - (a.utilization ?? -1)),
    totalOwed: roundMoney(summarized.reduce((sum, card) => sum + card.owed, 0)),
    totalLimit,
    overallUtilization:
      totalLimit > 0 ? Math.round((owedWithLimit / totalLimit) * 1000) / 10 : null,
  };
}
