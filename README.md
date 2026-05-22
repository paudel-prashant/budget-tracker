# Bugetrax

A personal finance app built with Next.js App Router, TypeScript, Material UI, Prisma, and PostgreSQL.

## Features

- Dashboard with summary cards and analytics charts (Recharts)
- Transaction management (create, list, delete)
- REST API routes for transactions and summary
- Light/dark mode, responsive layout, toast notifications
- PostgreSQL via Prisma (Vercel Postgres in production)

## Project structure

```
app/          # App Router pages and API routes
components/   # Feature modules + shared/ui, shared/layout, shared/providers
lib/          # Grouped by auth, config, db, data, domain, services, validation, utils, theme, types
auth/         # NextAuth configuration
prisma/       # Schema and migrations
styles/       # Global CSS
```

---

## Environment variables

Copy the example file and edit values for your machine:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL URL for the app (use **pooled** URL on Vercel) |
| `DIRECT_URL` | Yes for migrations | Non-pooled URL for `prisma migrate deploy` |
| `NODE_ENV` | No | Set automatically by Next.js |

### Local development (PostgreSQL)

Use Docker, [Neon](https://neon.tech), or a local Postgres install. Example `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_tracker?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/finance_tracker?schema=public"
```

Quick Docker Postgres:

```bash
docker run --name finance-tracker-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finance_tracker -p 5432:5432 -d postgres:16
```

### Vercel Postgres (production)

1. In the [Vercel Dashboard](https://vercel.com/dashboard), open your project.
2. Go to **Storage** → **Create Database** → **Postgres**.
3. Connect the database to the project.

Vercel injects variables such as `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`. Map them:

| App variable | Vercel variable |
|--------------|-----------------|
| `DATABASE_URL` | `POSTGRES_PRISMA_URL` |
| `DIRECT_URL` | `POSTGRES_URL_NON_POOLING` |

Set both for **Production**, **Preview**, and **Development** environments.

> **Note:** SQLite is no longer used. The app requires PostgreSQL in all environments.

---

## Local setup

```bash
npm install
cp .env.example .env
# Edit .env with your PostgreSQL connection strings

npm run db:migrate      # Apply migrations
npm run db:seed         # Optional: sample transactions
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Run production server locally |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply migrations (development) |
| `npm run db:migrate:deploy` | Apply migrations (production/CI) |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reset DB and re-run migrations + seed |

---

## Deploy to Vercel

### Prerequisites

- [Vercel account](https://vercel.com/signup)
- Git repository (GitHub, GitLab, or Bitbucket)
- Vercel Postgres database linked to the project

### Step 1 — Push code

```bash
git init
git add .
git commit -m "Prepare Bugetrax for Vercel"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2 — Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your repository.
3. Framework preset: **Next.js** (auto-detected).
4. Root directory: `.` (default).

### Step 3 — Add Vercel Postgres

1. In the project, open **Storage** → **Create Database** → **Postgres**.
2. Connect it to this project.
3. Under **Settings** → **Environment Variables**, add:

   - `DATABASE_URL` = `@POSTGRES_PRISMA_URL` (reference) or paste `POSTGRES_PRISMA_URL` value  
   - `DIRECT_URL` = `@POSTGRES_URL_NON_POOLING` (reference) or paste non-pooling URL  

   Use Vercel’s variable reference UI to link storage variables when possible.

### Step 4 — Configure build

`vercel.json` runs migrations then builds:

```json
{
  "buildCommand": "node scripts/vercel-migrate.mjs && npm run build"
}
```

**`DIRECT_URL` on Vercel:** Use the **direct** Neon/Vercel URL (host without `-pooler`). If you only set the pooler URL, the build script auto-derives a direct URL for migrations, but you should still configure `DIRECT_URL` correctly. A pooler-only setup can cause **P1002** (advisory lock timeout) in some cases.

For **Neon** (not Vercel Postgres storage):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Pooled connection string (`-pooler` host) |
| `DIRECT_URL` | Direct connection string (same endpoint id, **no** `-pooler`) |

Apply migrations once from your machine if a deploy is stuck:

```bash
vercel env pull .env.local
npm run db:migrate:deploy
```

You can override the build command in the Vercel UI only if you keep the same steps.

### Step 5 — Deploy

Click **Deploy** (or push to `main` for automatic deploys).

After the first successful deploy, optionally seed production data:

```bash
npx vercel env pull .env.local
npm run db:seed
```

Or run seed once from your machine with production `DATABASE_URL` (use with caution).

### Step 6 — Verify

1. Open the deployed URL.
2. Check **Dashboard** loads summary and charts.
3. Open **Transactions** → add and delete a test transaction.
4. Confirm API routes:
   - `GET /api/summary`
   - `GET /api/transactions`

---

## Build optimization notes

- **`prisma generate`** runs on `postinstall` and during the Vercel build so the client matches the schema.
- **`serverExternalPackages`** in `next.config.ts` keeps Prisma on the Node.js runtime (required for serverless).
- **Dashboard** uses `force-dynamic` so analytics always reflect live data (not stale static HTML).
- **Charts** mount client-side only to avoid Recharts SSR layout warnings and reduce build noise.
- **Prisma singleton** in `lib/db/prisma.ts` reuses one client per serverless instance to limit connection churn.
- Use **`POSTGRES_PRISMA_URL`** (pooled) for `DATABASE_URL` on Vercel; use **`POSTGRES_URL_NON_POOLING`** for `DIRECT_URL` during migrations only.

### Avoiding server-side runtime errors

- All Prisma usage runs on **`runtime = "nodejs"`** (API routes and dashboard page).
- `assertDatabaseUrl()` returns clear errors if `DATABASE_URL` is missing.
- Do not deploy without linking Postgres and setting both `DATABASE_URL` and `DIRECT_URL`.
- Run `npm run build` locally before pushing; fix TypeScript/ESLint errors early.

---

## Migrating from SQLite (legacy)

If you previously used `prisma/dev.db`:

1. Export data if needed (Prisma Studio or SQL dump).
2. Set PostgreSQL URLs in `.env`.
3. Run `npm run db:migrate` against the new database.
4. Re-seed or import data.

Old SQLite migration folders are removed; use the PostgreSQL migration in `prisma/migrations/20260522120000_init`.

---

## License

Private project — use as needed.
