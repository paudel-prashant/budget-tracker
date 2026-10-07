import { normalizeTitleKey } from "@/lib/domain/category-suggestion-engine";
import type { TransactionType } from "@/lib/types";

export type CategoryRuleMatchType = "CONTAINS" | "STARTS_WITH" | "EXACT";

export type CategoryRuleLike = {
  id: string;
  /** Stored normalized (normalizeTitleKey). */
  pattern: string;
  matchType: CategoryRuleMatchType;
  /** null = applies to income and expenses. */
  type: TransactionType | null;
  category: string;
  tags: string[];
};

const MATCH_SPECIFICITY: Record<CategoryRuleMatchType, number> = {
  EXACT: 3,
  STARTS_WITH: 2,
  CONTAINS: 1,
};

export function ruleMatchesTitle(
  rule: Pick<CategoryRuleLike, "pattern" | "matchType">,
  normalizedTitle: string
): boolean {
  if (!rule.pattern || !normalizedTitle) return false;

  switch (rule.matchType) {
    case "EXACT":
      return normalizedTitle === rule.pattern;
    case "STARTS_WITH":
      return normalizedTitle.startsWith(rule.pattern);
    case "CONTAINS":
      return normalizedTitle.includes(rule.pattern);
  }
}

/**
 * The rule that applies to a transaction, or null. When several match, the most
 * specific wins so users never have to order rules by hand:
 * exact > starts-with > contains, then the longer pattern ("uber eats" beats "uber"),
 * then a rule scoped to this income/expense type over one that applies to both.
 */
export function findMatchingRule<T extends CategoryRuleLike>(
  rules: T[],
  title: string,
  type: TransactionType
): T | null {
  const normalizedTitle = normalizeTitleKey(title);
  let best: T | null = null;

  for (const rule of rules) {
    if (rule.type !== null && rule.type !== type) continue;
    if (!ruleMatchesTitle(rule, normalizedTitle)) continue;
    if (!best || compareRuleSpecificity(rule, best) > 0) best = rule;
  }

  return best;
}

function compareRuleSpecificity(a: CategoryRuleLike, b: CategoryRuleLike): number {
  return (
    MATCH_SPECIFICITY[a.matchType] - MATCH_SPECIFICITY[b.matchType] ||
    a.pattern.length - b.pattern.length ||
    Number(a.type !== null) - Number(b.type !== null)
  );
}

/** Same cap as transaction validation (MAX_TAGS). */
export const MAX_TRANSACTION_TAGS = 10;

/** Union of existing and rule tags, keeping order, dropping duplicates, capped at the max. */
export function mergeTags(existing: string[], added: string[]): string[] {
  return [...new Set([...existing, ...added])].slice(0, MAX_TRANSACTION_TAGS);
}
