type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function validateAssistantBody(body: unknown): ValidationResult<{ message: string }> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const record = body as Record<string, unknown>;
  if (typeof record.message !== "string") {
    return { success: false, error: "message is required" };
  }

  const trimmed = record.message.trim();
  if (!trimmed) {
    return { success: false, error: "message cannot be empty" };
  }

  if (trimmed.length > 500) {
    return { success: false, error: "message must be 500 characters or fewer" };
  }

  return { success: true, data: { message: trimmed } };
}
