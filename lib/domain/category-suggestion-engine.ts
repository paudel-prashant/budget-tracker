import type { TransactionType } from "@/lib/types";
import { findMatchingRule, type CategoryRuleLike } from "@/lib/domain/category-rules";

export type CategorySuggestionSource = "rule" | "learned" | "keyword";

export type CategorySuggestion = {
  category: string;
  source: CategorySuggestionSource;
  /** Matched keyword, learned title key, or rule pattern (for display/debug). */
  matchedOn?: string;
  /** Tags a matching rule adds (rules only). */
  tags?: string[];
};

export type LearnedCategoryMapping = {
  titleKey: string;
  category: string;
  type: TransactionType;
};

type BuiltinRule = {
  keywords: string[];
  category: string;
  types: TransactionType[];
};

/** Built-in merchant/title keywords → preset categories. */
const BUILTIN_RULES: BuiltinRule[] = [
  {
    keywords: [
      "starbucks",
      "mcdonald",
      "mcdonalds",
      "chipotle",
      "subway",
      "domino",
      "pizza hut",
      "restaurant",
      "cafe",
      "coffee",
      "dunkin",
      "wendy",
      "taco bell",
      "grubhub",
      "doordash",
      "uber eats",
      "ubereats",
      "kfc",
      "burger king",
      "panera",
      "whole foods",
      "trader joe",
      "kroger",
      "safeway",
      "grocery",
      "supermarket",
      "food",
      "beverage",
      "lunch",
      "dinner",
      "breakfast",
    ],
    category: "Food & Beverages",
    types: ["EXPENSE"],
  },
  {
    keywords: [
      "uber",
      "lyft",
      "taxi",
      "cab",
      "metro",
      "transit",
      "bus",
      "train",
      "parking",
      "toll",
      "gas station",
      "shell",
      "exxon",
      "chevron",
      "bp gas",
      "fuel",
      "airline",
      "delta",
      "united air",
      "southwest",
      "car wash",
      "auto repair",
    ],
    category: "Transportation",
    types: ["EXPENSE"],
  },
  {
    keywords: [
      "netflix",
      "spotify",
      "hulu",
      "disney+",
      "disney plus",
      "apple music",
      "youtube premium",
      "hbo",
      "cinema",
      "movie",
      "steam",
      "playstation",
      "xbox",
      "concert",
    ],
    category: "Entertainment",
    types: ["EXPENSE"],
  },
  {
    keywords: [
      "amazon prime",
      "costco",
      "walmart",
      "target",
      "ikea",
      "home depot",
      "lowes",
      "bed bath",
    ],
    category: "Household",
    types: ["EXPENSE"],
  },
  {
    keywords: [
      "cvs",
      "walgreens",
      "pharmacy",
      "hospital",
      "clinic",
      "dentist",
      "doctor",
      "medical",
      "health",
    ],
    category: "Healthcare",
    types: ["EXPENSE"],
  },
  {
    keywords: [
      "electric",
      "water bill",
      "gas bill",
      "internet",
      "comcast",
      "verizon",
      "at&t",
      "att ",
      "t-mobile",
      "utility",
    ],
    category: "Utilities",
    types: ["EXPENSE"],
  },
  {
    keywords: [
      "rent",
      "mortgage",
      "landlord",
      "property tax",
      "hoa",
    ],
    category: "Household",
    types: ["EXPENSE"],
  },
  {
    keywords: [
      "salary",
      "payroll",
      "paycheck",
      "direct deposit",
      "wages",
      "employer",
    ],
    category: "Salary",
    types: ["INCOME"],
  },
  {
    keywords: [
      "freelance",
      "contractor",
      "consulting",
      "invoice paid",
      "client payment",
    ],
    category: "Freelance",
    types: ["INCOME"],
  },
  {
    keywords: [
      "dividend",
      "interest",
      "brokerage",
      "fidelity",
      "vanguard",
      "robinhood",
      "401k",
    ],
    category: "Investments",
    types: ["INCOME"],
  },
];

/** Normalize title for keyword / learned matching. */
export function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleContainsKeyword(normalizedTitle: string, keyword: string): boolean {
  const normalizedKeyword = normalizeTitleKey(keyword);
  if (!normalizedKeyword) return false;
  if (normalizedTitle === normalizedKeyword) return true;
  if (normalizedTitle.includes(normalizedKeyword)) return true;

  const words = normalizedTitle.split(" ");
  return words.some((word) => word === normalizedKeyword || word.startsWith(normalizedKeyword));
}

/**
 * Match built-in keyword rules (longest keyword wins).
 */
export function suggestFromBuiltinKeywords(
  title: string,
  type: TransactionType
): CategorySuggestion | null {
  const normalizedTitle = normalizeTitleKey(title);
  if (!normalizedTitle) return null;

  let best: { category: string; keyword: string } | null = null;

  for (const rule of BUILTIN_RULES) {
    if (!rule.types.includes(type)) continue;

    for (const keyword of rule.keywords) {
      if (!titleContainsKeyword(normalizedTitle, keyword)) continue;

      if (!best || keyword.length > best.keyword.length) {
        best = { category: rule.category, keyword };
      }
    }
  }

  if (!best) return null;

  return {
    category: best.category,
    source: "keyword",
    matchedOn: best.keyword,
  };
}

/**
 * Match user-learned mappings (longest titleKey wins).
 */
export function suggestFromLearnedMappings(
  title: string,
  type: TransactionType,
  mappings: LearnedCategoryMapping[]
): CategorySuggestion | null {
  const normalizedTitle = normalizeTitleKey(title);
  if (!normalizedTitle) return null;

  const relevant = mappings
    .filter((m) => m.type === type && m.titleKey && m.category)
    .sort((a, b) => b.titleKey.length - a.titleKey.length);

  for (const mapping of relevant) {
    const key = mapping.titleKey;
    if (
      normalizedTitle === key ||
      normalizedTitle.includes(key) ||
      key.includes(normalizedTitle)
    ) {
      return {
        category: mapping.category,
        source: "learned",
        matchedOn: key,
      };
    }
  }

  return null;
}

/** User rules beat learned mappings, which beat built-in keywords. */
export function suggestCategory(
  title: string,
  type: TransactionType,
  learnedMappings: LearnedCategoryMapping[] = [],
  rules: CategoryRuleLike[] = []
): CategorySuggestion | null {
  const rule = findMatchingRule(rules, title, type);
  if (rule) {
    return { category: rule.category, source: "rule", matchedOn: rule.pattern, tags: rule.tags };
  }

  const learned = suggestFromLearnedMappings(title, type, learnedMappings);
  if (learned) return learned;

  return suggestFromBuiltinKeywords(title, type);
}
