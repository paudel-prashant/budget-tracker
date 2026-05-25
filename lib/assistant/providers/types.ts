import type { AssistantReply } from "@/lib/assistant/types";

export type AssistantProviderId = "rule-based" | "groq";

export interface AssistantProvider {
  readonly id: AssistantProviderId;
  answer(userId: string, message: string): Promise<AssistantReply>;
}
