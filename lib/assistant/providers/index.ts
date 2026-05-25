import { groqAssistantProvider } from "@/lib/assistant/providers/groq-provider";
import { ruleBasedAssistantProvider } from "@/lib/assistant/providers/rule-based-provider";
import type { AssistantProvider, AssistantProviderId } from "@/lib/assistant/providers/types";

const providers: Record<AssistantProviderId, AssistantProvider> = {
  "rule-based": ruleBasedAssistantProvider,
  groq: groqAssistantProvider,
};

export function getAssistantProvider(): AssistantProvider {
  const id = (process.env.ASSISTANT_PROVIDER ?? "rule-based") as AssistantProviderId;
  return providers[id] ?? ruleBasedAssistantProvider;
}

export { ruleBasedAssistantProvider, groqAssistantProvider };
