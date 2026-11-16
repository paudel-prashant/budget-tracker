import type { Asset, FinanceAccountType, Liability, NetWorthAccountItem } from "@/lib/types";

export type CompositionGroup = {
  key: string;
  label: string;
  value: number;
  /** Fixed palette slot — follows the group, never its rank. */
  slot: number;
};

/** Stable group order = colour slot order (≤ 6, so no 7th hue is ever needed). */
const ASSET_GROUPS = ["Cash", "Investments", "Gold", "Real Estate", "Retirement", "Other"] as const;
const LIABILITY_GROUPS = ["Credit Card", "Loan", "Mortgage", "Student Loan", "Other"] as const;

const ASSET_ACCOUNT_GROUP: Record<FinanceAccountType, (typeof ASSET_GROUPS)[number]> = {
  CHECKING: "Cash",
  SAVINGS: "Cash",
  CASH: "Cash",
  OTHER: "Cash",
  CREDIT: "Cash", // a credit card in credit (overpaid) is cash-like
  INVESTMENT: "Investments",
};

function matchGroup<T extends string>(category: string, groups: readonly T[], fallback: T): T {
  const normalized = category.trim().toLowerCase();
  return groups.find((group) => group.toLowerCase() === normalized) ?? fallback;
}

function toGroups<T extends string>(groups: readonly T[], totals: Map<T, number>): CompositionGroup[] {
  return groups
    .map((label, slot) => ({
      key: label,
      label,
      value: Math.round((totals.get(label) ?? 0) * 100) / 100,
      slot,
    }))
    .filter((group) => group.value > 0);
}

/** What you own and what you owe, grouped into a handful of stable buckets. */
export function buildNetWorthComposition(
  assets: Asset[],
  liabilities: Liability[],
  accounts: NetWorthAccountItem[]
): { assets: CompositionGroup[]; liabilities: CompositionGroup[] } {
  const assetTotals = new Map<(typeof ASSET_GROUPS)[number], number>();
  const liabilityTotals = new Map<(typeof LIABILITY_GROUPS)[number], number>();
  const add = <T>(map: Map<T, number>, key: T, value: number) =>
    map.set(key, (map.get(key) ?? 0) + value);

  for (const asset of assets) {
    add(assetTotals, matchGroup(asset.category, ASSET_GROUPS, "Other"), asset.value);
  }
  for (const liability of liabilities) {
    add(liabilityTotals, matchGroup(liability.category, LIABILITY_GROUPS, "Other"), liability.value);
  }
  for (const account of accounts) {
    if (account.asset > 0) add(assetTotals, ASSET_ACCOUNT_GROUP[account.type], account.asset);
    if (account.liability > 0) {
      add(liabilityTotals, account.type === "CREDIT" ? "Credit Card" : "Other", account.liability);
    }
  }

  return {
    assets: toGroups(ASSET_GROUPS, assetTotals),
    liabilities: toGroups(LIABILITY_GROUPS, liabilityTotals),
  };
}
