import { detectAssistantIntent } from "@/lib/assistant/detect-intent";
import { formatAssistantResponse } from "@/lib/assistant/format-response";
import { generateAssistantInsights } from "@/lib/assistant/generate-insights";
import { getSuggestedQuestionsForIntent } from "@/lib/assistant/suggested-questions";
import type { AssistantProvider } from "@/lib/assistant/providers/types";
import type { AssistantReply } from "@/lib/assistant/types";
import { getAssistantAnalyticsSnapshot } from "@/lib/data/assistant-analytics-data";

export const ruleBasedAssistantProvider: AssistantProvider = {
  id: "rule-based",

  async answer(userId: string, message: string): Promise<AssistantReply> {
    const trimmed = message.trim();
    if (!trimmed) {
      return {
        message:
          "Ask a question about your spending, categories, savings, or unusual charges. I use your Budgetrax transaction data to respond.",
        intent: "unknown",
        insights: [],
        suggestedQuestions: getSuggestedQuestionsForIntent("general_summary", { count: 12 }),
        provider: "rule-based",
      };
    }

    const analytics = await getAssistantAnalyticsSnapshot(userId);
    const intent = detectAssistantIntent(trimmed);
    const resolvedIntent = intent === "unknown" ? "general_summary" : intent;
    const insights = generateAssistantInsights(resolvedIntent, analytics);
    const responseMessage = formatAssistantResponse(
      resolvedIntent,
      insights,
      analytics
    );

    return {
      message: responseMessage,
      intent: resolvedIntent,
      insights,
      suggestedQuestions: getSuggestedQuestionsForIntent(resolvedIntent, {
        exclude: trimmed,
        count: 10,
      }),
      provider: "rule-based",
    };
  },
};
