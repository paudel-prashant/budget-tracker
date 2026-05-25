import type {
  AssistantAnalyticsSnapshot,
  AssistantInsight,
  AssistantIntent,
} from "@/lib/assistant/types";

const INTENT_INTROS: Record<AssistantIntent, string> = {
  spending_trend:
    "Here is what changed in your spending based on your transaction history:",
  category_increase:
    "Comparing categories month over month, this stood out:",
  savings_advice:
    "Based on your current income, expenses, and budgets, here are practical ways to save more:",
  top_expenses:
    "Your highest expense categories this month:",
  unusual_spending:
    "These charges look unusual relative to your typical patterns:",
  general_summary:
    "Here is a quick read on your finances from your recorded transactions:",
  unknown:
    "I analyzed your Budgetrax data. Here is what stands out:",
};

export function formatAssistantResponse(
  intent: AssistantIntent,
  insights: AssistantInsight[],
  data: AssistantAnalyticsSnapshot
): string {
  if (!data.hasTransactions) {
    return "I do not have enough transaction data yet. Add a few income and expense entries, then ask again for personalized insights.";
  }

  const intro = INTENT_INTROS[intent] ?? INTENT_INTROS.unknown;
  const bullets = insights.map((item) => `• **${item.title}** — ${item.detail}`);

  const closing =
    intent === "savings_advice"
      ? "\n\nThese suggestions are generated from your actual numbers—not generic financial advice."
      : "\n\nAsk a follow-up question or pick a suggested prompt below.";

  return [intro, "", ...bullets, closing].join("\n");
}
