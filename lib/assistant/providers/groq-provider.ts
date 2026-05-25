import type { AssistantProvider } from "@/lib/assistant/providers/types";
import type { AssistantReply } from "@/lib/assistant/types";
import { ruleBasedAssistantProvider } from "@/lib/assistant/providers/rule-based-provider";

/**
 * Optional Groq-backed provider. Falls back to rule-based until GROQ_API_KEY is wired.
 */
export const groqAssistantProvider: AssistantProvider = {
  id: "groq",

  async answer(userId: string, message: string): Promise<AssistantReply> {
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      const fallback = await ruleBasedAssistantProvider.answer(userId, message);
      return {
        ...fallback,
        message: `${fallback.message}\n\n_Note: Cloud LLM mode is not configured; showing on-device insights._`,
        provider: "rule-based",
      };
    }

    // Placeholder for future Groq integration — keep rule-based as source of truth for numbers.
    const fallback = await ruleBasedAssistantProvider.answer(userId, message);
    return { ...fallback, provider: "groq" };
  },
};
