import type { AssistantIntent } from "@/lib/assistant/types";

/** Master pool — every prompt maps to a supported analytics intent. */
export const QUESTIONS_BY_INTENT: Record<
  Exclude<AssistantIntent, "unknown">,
  readonly string[]
> = {
  spending_trend: [
    "Why did I spend more this month?",
    "Did my expenses go up compared to last month?",
    "How much did I spend this month vs last month?",
    "Is my spending trending up or down?",
    "Why are my expenses higher than last month?",
    "What changed in my spending this month?",
    "Am I spending more than last month?",
    "How much did my expenses increase?",
    "Compare my spending to last month",
    "Did I overspend this month?",
    "What's my expense trend over recent months?",
    "Why is my total spending up?",
    "How much am I spending per month lately?",
    "Are my expenses getting worse?",
    "What drove higher spending this month?",
    "Month over month, how did my spending change?",
  ],
  category_increase: [
    "Which category increased the most?",
    "What category grew the most month over month?",
    "Which spending category went up the most?",
    "Where did my spending increase the most?",
    "Compare my categories to last month",
    "What categories are rising?",
    "Which category cost me more than before?",
    "Biggest category increase this month?",
    "What category had the largest jump?",
    "Did any category spike compared to last month?",
    "Show categories that increased vs last month",
    "Which expense type is growing fastest?",
    "What changed in my category breakdown?",
    "Rank categories by how much they increased",
    "Any category spending a lot more now?",
  ],
  savings_advice: [
    "How can I save more money?",
    "What should I cut to save more?",
    "How do I improve my savings rate?",
    "Give me tips to reduce spending",
    "How can I spend less?",
    "Where can I cut back on expenses?",
    "Am I saving enough?",
    "How do I boost my savings this month?",
    "What can I do to save more?",
    "Help me reduce my expenses",
    "Which category should I trim first?",
    "How can I improve my savings rate?",
    "Any budgets I should tighten?",
    "What's my daily spending pace?",
    "How do I spend less without hurting essentials?",
    "Recommend ways to cut discretionary spending",
    "Am I on track to save money this month?",
    "What would help my savings the most?",
  ],
  top_expenses: [
    "What are my highest expense categories?",
    "Where do I spend the most money?",
    "What are my top spending categories?",
    "Which categories cost me the most?",
    "Show my biggest expense categories",
    "What's my largest spending category?",
    "Top 3 categories by spending?",
    "Where does most of my money go?",
    "Which category takes the biggest share?",
    "What am I spending the most on?",
    "Break down my biggest expenses",
    "Highest spending areas this month?",
    "Rank my expense categories by amount",
    "What's eating up my budget?",
    "Show where my cash is going",
  ],
  unusual_spending: [
    "Any unusual spending lately?",
    "Did I have any unexpected expenses?",
    "Flag any unusual transactions",
    "Any spending spikes this month?",
    "Show me outliers in my spending",
    "Any large or unusual purchases?",
    "Detect abnormal spending patterns",
    "Were there any one-off big expenses?",
    "Anything stand out in my transactions?",
    "Unusual charges I should review?",
    "Did I make any unusually large payments?",
    "Find expenses that look out of the ordinary",
    "Any surprise spending this month?",
    "Highlight suspicious or large spends",
  ],
  general_summary: [
    "Give me a summary of my finances",
    "How am I doing financially?",
    "Overview of my income and expenses",
    "Quick financial health check",
    "Summarize this month's money",
    "How's my budget looking?",
    "What's my financial snapshot?",
    "Income vs expenses this month?",
    "How much did I earn vs spend?",
    "What's my savings this month?",
    "Tell me about my money this month",
    "Financial overview please",
    "How healthy are my finances right now?",
    "Summary of income, spending, and savings",
    "What should I know about my finances today?",
    "How much income did I have this month?",
    "What's my savings rate?",
    "Am I spending more than I earn?",
  ],
};

export const ALL_SUGGESTED_QUESTIONS: readonly string[] = Object.values(
  QUESTIONS_BY_INTENT
).flat();

/** Shown on first open and in GET /api/assistant — diverse starter set. */
export const DEFAULT_SUGGESTED_QUESTIONS: readonly string[] = [
  "Why did I spend more this month?",
  "Which category increased the most?",
  "How can I save more money?",
  "What are my highest expense categories?",
  "Any unusual spending lately?",
  "Give me a summary of my finances",
  "Did my expenses go up compared to last month?",
  "Where do I spend the most money?",
  "How much did I earn vs spend?",
  "What's my savings rate?",
  "Am I saving enough?",
  "Compare my spending to last month",
  "What category grew the most month over month?",
  "Any spending spikes this month?",
  "How's my budget looking?",
  "What's my daily spending pace?",
  "Which category should I trim first?",
  "Month over month, how did my spending change?",
  "Show me outliers in my spending",
  "Financial overview please",
] as const;

const FOLLOW_UP_COUNT = 10;

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickFromPool(
  pool: readonly string[],
  count: number,
  exclude: readonly string[] = []
): string[] {
  const excludeSet = new Set(exclude.map((q) => q.toLowerCase()));
  const filtered = pool.filter((q) => !excludeSet.has(q.toLowerCase()));
  const source = filtered.length >= count ? filtered : pool;
  return shuffle(source).slice(0, count);
}

export function getSuggestedQuestionsForIntent(
  intent: string,
  options?: { exclude?: string; count?: number }
): string[] {
  const count = options?.count ?? FOLLOW_UP_COUNT;
  const exclude = options?.exclude ? [options.exclude] : [];

  const key = intent as Exclude<AssistantIntent, "unknown">;
  const pool = QUESTIONS_BY_INTENT[key];

  if (pool) {
    return pickFromPool(pool, count, exclude);
  }

  return pickFromPool(DEFAULT_SUGGESTED_QUESTIONS, count, exclude);
}
