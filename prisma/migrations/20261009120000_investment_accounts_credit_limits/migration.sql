-- Purely additive: INVESTMENT account type and FinanceAccount.creditLimit.
-- Hand-written from `prisma migrate diff`; apply with `npm run db:migrate:deploy`,
-- never `prisma migrate dev` (see 20260805120000 re: drift).

-- AlterEnum
ALTER TYPE "FinanceAccountType" ADD VALUE 'INVESTMENT';

-- AlterTable
ALTER TABLE "FinanceAccount" ADD COLUMN     "creditLimit" DOUBLE PRECISION;

