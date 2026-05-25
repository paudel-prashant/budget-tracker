import { getAssistantProvider } from "@/lib/assistant/providers";
import type { AssistantReply } from "@/lib/assistant/types";

export async function runAssistant(userId: string, message: string): Promise<AssistantReply> {
  const provider = getAssistantProvider();
  return provider.answer(userId, message);
}
