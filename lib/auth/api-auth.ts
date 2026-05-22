import { auth } from "@/auth";
import { jsonError } from "@/lib/utils/api-utils";

export async function requireApiUserId(): Promise<
  { userId: string; unauthorized: null } | { userId: null; unauthorized: Response }
> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { userId: null, unauthorized: jsonError("Unauthorized", 401) };
  }

  return { userId, unauthorized: null };
}
