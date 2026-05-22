/**
 * Applies Prisma migrations (run locally or in CI — not during Vercel build).
 * Uses a direct Neon URL; pooler URLs are auto-converted. Disables advisory lock to avoid P1002 on Neon.
 */
import { spawnSync } from "node:child_process";

function normalizeUrl(url) {
  return url.replace(/^postgres:/, "postgresql:");
}

function looksLikePooledUrl(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    const host = parsed.hostname.toLowerCase();
    return (
      host.includes("-pooler") ||
      host.includes("pooler.") ||
      parsed.searchParams.get("pgbouncer") === "true"
    );
  } catch {
    return url.includes("-pooler") || url.includes("pgbouncer=true");
  }
}

/** Neon pooled host: ep-xxx-pooler.region... → ep-xxx.region... */
function toDirectConnectionUrl(url) {
  const normalized = normalizeUrl(url);
  const parsed = new URL(normalized);

  if (parsed.hostname.includes("-pooler")) {
    parsed.hostname = parsed.hostname.replace("-pooler", "");
  }

  parsed.searchParams.delete("pgbouncer");
  parsed.searchParams.delete("connection_limit");

  return parsed.toString();
}

function resolveDirectUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  let directUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.error(
      "\n[vercel-migrate] DATABASE_URL is not set. Link Postgres in Vercel and map DATABASE_URL.\n"
    );
    process.exit(1);
  }

  if (!directUrl) {
    console.warn(
      "[vercel-migrate] DIRECT_URL is not set; deriving a direct URL from DATABASE_URL for migrations."
    );
    directUrl = databaseUrl;
  }

  if (looksLikePooledUrl(directUrl)) {
    const derived = toDirectConnectionUrl(directUrl);
    if (!looksLikePooledUrl(derived)) {
      console.warn(
        "[vercel-migrate] DIRECT_URL uses a pooler; using direct Neon host for migrations only."
      );
      console.warn(
        "[vercel-migrate] Set DIRECT_URL in Vercel to the non-pooling connection string (host without -pooler)."
      );
      return derived;
    }

    console.error(`
[vercel-migrate] Could not derive a direct database URL from DIRECT_URL.

For Neon, set DIRECT_URL to the connection string whose host does NOT include "-pooler".
Example:
  DATABASE_URL  → ...@ep-xxx-pooler.us-east-1.aws.neon.tech/...
  DIRECT_URL    → ...@ep-xxx.us-east-1.aws.neon.tech/...
`);
    process.exit(1);
  }

  return directUrl;
}

const migrationDirectUrl = resolveDirectUrl();
process.env.DIRECT_URL = migrationDirectUrl;
// Neon/serverless: advisory locks often time out (P1002). Safe when only one migrate runs at a time.
process.env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "1";

console.log("[vercel-migrate] Applying migrations via direct connection...");

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

if (result.status !== 0) {
  console.error(`
[vercel-migrate] migrate deploy failed.

If you see P1002 (advisory lock timeout):
  • Cancel other in-flight deploys or local "prisma migrate" runs, then redeploy.
  • Or run once locally: vercel env pull && npm run db:migrate:deploy
`);
  process.exit(result.status ?? 1);
}

console.log("[vercel-migrate] Migrations applied successfully.");
