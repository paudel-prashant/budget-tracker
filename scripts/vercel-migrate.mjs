/**
 * Runs `prisma migrate deploy` for Vercel builds.
 * Requires DIRECT_URL (non-pooled). Pooled URLs cannot acquire advisory locks (P1002).
 */
import { spawnSync } from "node:child_process";

function looksLikePooledUrl(url) {
  try {
    const host = new URL(url.replace(/^postgres:/, "postgresql:")).hostname.toLowerCase();
    return host.includes("-pooler") || host.includes("pooler.");
  } catch {
    return url.includes("-pooler") || url.includes("pgbouncer=true");
  }
}

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error(
    "\n[vercel-migrate] DATABASE_URL is not set. Link Postgres in Vercel and map DATABASE_URL.\n"
  );
  process.exit(1);
}

if (!directUrl) {
  console.error(`
[vercel-migrate] DIRECT_URL is not set.

Prisma migrations need a direct (non-pooled) connection. On Vercel Postgres / Neon:

  DATABASE_URL  → pooled URL (e.g. POSTGRES_PRISMA_URL or Neon -pooler host)
  DIRECT_URL    → direct URL  (e.g. POSTGRES_URL_NON_POOLING or Neon host WITHOUT -pooler)

See .env.example and README.md (Deploy → Step 3).
`);
  process.exit(1);
}

if (looksLikePooledUrl(directUrl)) {
  console.error(`
[vercel-migrate] DIRECT_URL appears to use a connection pooler (${directUrl.includes("-pooler") ? "hostname contains -pooler" : "pooler detected"}).

Use the non-pooling URL for DIRECT_URL. For Neon, copy the connection string whose host does NOT include "-pooler".
`);
  process.exit(1);
}

console.log("[vercel-migrate] Applying migrations via DIRECT_URL...");

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (result.status !== 0) {
  console.error(`
[vercel-migrate] migrate deploy failed.

If you see P1002 (advisory lock timeout):
  • Ensure DIRECT_URL is the direct Neon/Vercel URL, not the pooler.
  • Cancel other in-flight deploys or local "prisma migrate" runs, then redeploy.
  • Or run migrations once locally: vercel env pull && npm run db:migrate:deploy
`);
  process.exit(result.status ?? 1);
}

console.log("[vercel-migrate] Migrations applied successfully.");
