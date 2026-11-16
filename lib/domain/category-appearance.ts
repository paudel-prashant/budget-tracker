/**
 * Icon + colour for any category name — presets match exactly, custom categories
 * ("Lottery", "Netflix", "Gym") match by keyword, and anything else gets a stable
 * colour derived from its name. Dependency-free; the React icon map lives in
 * components/shared/ui/category-icon.tsx.
 */

export type CategoryIconKey =
  | "groceries" | "restaurant" | "coffee" | "bar" | "fuel" | "car" | "transit" | "flight"
  | "utilities" | "phone" | "internet" | "subscriptions" | "movie" | "gaming" | "health"
  | "household" | "rent" | "insurance" | "education" | "apparel" | "beauty" | "shopping"
  | "gift" | "charity" | "salary" | "business" | "freelance" | "investments" | "lottery"
  | "pets" | "fitness" | "kids" | "gold" | "cash" | "bank" | "realEstate" | "retirement"
  | "creditCard" | "loan" | "tax" | "transfer" | "repairs" | "income" | "other" | "tag";

export type CategoryAppearance = {
  icon: CategoryIconKey;
  /** Mid-tone hex that reads on both light and dark surfaces. */
  color: string;
};

type Rule = CategoryAppearance & { keywords: string[] };

/** Order matters: more specific rules first ("student loan" before "loan"/"school"). */
const RULES: Rule[] = [
  { icon: "education", color: "#6366F1", keywords: ["student loan", "osap"] },
  { icon: "loan", color: "#B91C1C", keywords: ["loan", "debt", "line of credit", "loc"] },
  { icon: "rent", color: "#7C3AED", keywords: ["rent", "mortgage", "housing", "condo fee", "strata"] },
  { icon: "creditCard", color: "#DC2626", keywords: ["credit card", "visa", "mastercard", "amex"] },
  { icon: "groceries", color: "#16A34A", keywords: ["grocer", "supermarket", "costco", "walmart"] },
  { icon: "coffee", color: "#92400E", keywords: ["coffee", "cafe", "café", "tim hortons", "starbucks"] },
  { icon: "bar", color: "#BE185D", keywords: ["alcohol", "bar", "pub", "liquor", "beer", "wine"] },
  { icon: "restaurant", color: "#EA580C", keywords: ["food", "restaurant", "dining", "takeout", "take-out", "meal", "lunch", "dinner", "beverage", "snack", "delivery"] },
  { icon: "fuel", color: "#E11D48", keywords: ["fuel", "gas", "gasoline", "petrol", "ev charging", "charging"] },
  { icon: "transit", color: "#0284C7", keywords: ["transit", "bus", "train", "subway", "presto", "metro"] },
  { icon: "flight", color: "#0EA5E9", keywords: ["travel", "flight", "airfare", "hotel", "vacation", "trip", "airbnb"] },
  { icon: "car", color: "#2563EB", keywords: ["transport", "car", "auto", "uber", "lyft", "taxi", "parking", "toll", "vehicle"] },
  { icon: "phone", color: "#0891B2", keywords: ["data plan", "phone", "mobile", "cell", "wireless"] },
  { icon: "internet", color: "#06B6D4", keywords: ["internet", "wifi", "wi-fi", "broadband"] },
  { icon: "utilities", color: "#CA8A04", keywords: ["utilit", "hydro", "electric", "power", "water", "heating", "energy"] },
  // Before subscriptions so "Gym membership" is fitness, not a generic membership.
  { icon: "fitness", color: "#F97316", keywords: ["fitness", "gym", "sport", "yoga", "workout"] },
  { icon: "subscriptions", color: "#8B5CF6", keywords: ["subscription", "streaming", "netflix", "spotify", "disney", "prime", "membership"] },
  { icon: "gaming", color: "#A855F7", keywords: ["gaming", "game", "playstation", "xbox", "steam", "nintendo"] },
  { icon: "movie", color: "#DB2777", keywords: ["entertainment", "movie", "cinema", "concert", "event", "fun", "hobby", "hobbies"] },
  { icon: "lottery", color: "#9333EA", keywords: ["lottery", "lotto", "casino", "gambling", "betting", "bet"] },
  { icon: "health", color: "#EF4444", keywords: ["health", "medical", "doctor", "dental", "dentist", "pharmacy", "drug", "medicine", "therapy", "clinic", "vision"] },
  { icon: "insurance", color: "#0369A1", keywords: ["insurance"] },
  { icon: "education", color: "#6366F1", keywords: ["education", "school", "tuition", "course", "book", "learning", "college", "university"] },
  { icon: "kids", color: "#F59E0B", keywords: ["kid", "child", "baby", "daycare", "childcare"] },
  { icon: "pets", color: "#B45309", keywords: ["pet", "vet", "dog", "cat"] },
  { icon: "apparel", color: "#C026D3", keywords: ["apparel", "cloth", "shoe", "fashion"] },
  { icon: "beauty", color: "#EC4899", keywords: ["beauty", "salon", "hair", "cosmetic", "spa", "personal care", "barber"] },
  { icon: "repairs", color: "#78716C", keywords: ["repair", "maintenance", "hardware", "tools"] },
  { icon: "household", color: "#A16207", keywords: ["household", "home", "furniture", "cleaning"] },
  { icon: "shopping", color: "#D946EF", keywords: ["shopping", "amazon", "electronics", "online"] },
  { icon: "charity", color: "#E11D48", keywords: ["charity", "donation", "church", "tithe"] },
  { icon: "gift", color: "#F43F5E", keywords: ["gift", "present", "birthday"] },
  { icon: "salary", color: "#15803D", keywords: ["salary", "paycheque", "paycheck", "payroll", "wage"] },
  { icon: "freelance", color: "#0D9488", keywords: ["freelance", "contract", "side hustle", "consulting", "gig"] },
  { icon: "business", color: "#0F766E", keywords: ["business"] },
  { icon: "gold", color: "#C9A227", keywords: ["gold", "silver", "bullion", "jewel", "precious"] },
  { icon: "retirement", color: "#0891B2", keywords: ["retirement", "rrsp", "pension", "401k"] },
  { icon: "investments", color: "#2563EB", keywords: ["invest", "stock", "dividend", "crypto", "tfsa", "etf", "brokerage", "interest"] },
  { icon: "realEstate", color: "#7C2D12", keywords: ["real estate", "property"] },
  { icon: "tax", color: "#64748B", keywords: ["tax", "taxes", "cra", "irs"] },
  { icon: "transfer", color: "#64748B", keywords: ["transfer"] },
  { icon: "cash", color: "#16A34A", keywords: ["cash", "saving", "emergency fund"] },
  { icon: "bank", color: "#1D4ED8", keywords: ["bank", "chequing", "checking", "fee"] },
  { icon: "income", color: "#16A34A", keywords: ["income", "refund", "rebate", "cashback", "bonus", "reimburse"] },
  { icon: "other", color: "#64748B", keywords: ["other", "misc", "uncategorized"] },
];

/** Fallback colours for unrecognised categories, picked by a stable hash of the name. */
const FALLBACK_COLORS = [
  "#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#16A34A",
  "#0891B2", "#CA8A04", "#4F46E5", "#0D9488", "#C026D3",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keywords match at a word start ("grocer" → "Groceries"). Short ones (≤3 letters) must be
 * the whole word, optionally plural, so "car" hits "Car wash" but not "Gift card".
 */
function keywordPattern(keyword: string): string {
  const escaped = escapeRegExp(keyword);
  return keyword.length <= 3 ? `${escaped}s?(?![a-z])` : escaped;
}

const COMPILED = RULES.map((rule) => ({
  ...rule,
  pattern: new RegExp(`(^|[^a-z])(${rule.keywords.map(keywordPattern).join("|")})`, "i"),
}));

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const cache = new Map<string, CategoryAppearance>();

export function getCategoryAppearance(category: string | null | undefined): CategoryAppearance {
  const name = (category ?? "").trim().toLowerCase();
  const cached = cache.get(name);
  if (cached) return cached;

  const rule = name ? COMPILED.find((candidate) => candidate.pattern.test(name)) : undefined;
  const appearance: CategoryAppearance = rule
    ? { icon: rule.icon, color: rule.color }
    : { icon: "tag", color: FALLBACK_COLORS[hashString(name) % FALLBACK_COLORS.length] };

  cache.set(name, appearance);
  return appearance;
}
