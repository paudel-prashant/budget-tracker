/**
 * Central error-reporting hook for server-side code (API routes, data layer, etc.).
 *
 * Today this just writes a structured JSON line to stderr, which Vercel captures in
 * its function logs and makes greppable/filterable. To wire in a provider like Sentry
 * later, this is the one place that needs to change — e.g. add
 * `Sentry.captureException(error, { extra: context })` alongside (or instead of) the
 * console call below. Call sites don't need to know which backend is behind this.
 */

type LogContext = Record<string, unknown>;

type SerializedError = {
  name: string;
  message: string;
  stack?: string;
};

function serializeError(error: unknown): SerializedError | { message: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Stack traces are verbose and not useful in production log volume;
      // keep them for local debugging only.
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }

  return { message: typeof error === "string" ? error : JSON.stringify(error) };
}

export function reportError(message: string, error: unknown, context: LogContext = {}): void {
  const entry = {
    level: "error" as const,
    message,
    error: serializeError(error),
    ...context,
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify(entry));
}
