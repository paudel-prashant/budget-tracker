-- User display / base currency (default CAD for Canadian users)
ALTER TABLE "User" ADD COLUMN "preferredCurrency" TEXT NOT NULL DEFAULT 'CAD';

-- Per-transaction currency with normalized amount for totals
ALTER TABLE "Transaction" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE "Transaction" ADD COLUMN "baseAmount" DOUBLE PRECISION;
UPDATE "Transaction" SET "baseAmount" = "amount" WHERE "baseAmount" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "baseAmount" SET NOT NULL;

-- Finance accounts default to CAD
ALTER TABLE "FinanceAccount" ALTER COLUMN "currency" SET DEFAULT 'CAD';
