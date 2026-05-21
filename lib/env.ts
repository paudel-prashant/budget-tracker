/**
 * Validates database environment variables with actionable error messages.
 */
export function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Configure PostgreSQL locally or link Vercel Postgres. See README.md."
    );
  }
}

export function assertMigrationEnv(): void {
  assertDatabaseUrl();

  if (!process.env.DIRECT_URL) {
    throw new Error(
      "DIRECT_URL is not set. Required for Prisma migrations with a pooled DATABASE_URL. See README.md."
    );
  }
}
