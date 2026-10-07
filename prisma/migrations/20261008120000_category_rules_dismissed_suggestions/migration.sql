-- Purely additive: CategoryRule (+ CategoryRuleMatch enum) and DismissedSuggestion.
-- Hand-written from `prisma migrate diff` (previous schema -> new schema); apply with
-- `npm run db:migrate:deploy`, never `prisma migrate dev` (see 20260805120000 re: drift).

-- CreateEnum
CREATE TYPE "CategoryRuleMatch" AS ENUM ('CONTAINS', 'STARTS_WITH', 'EXACT');

-- CreateTable
CREATE TABLE "CategoryRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "matchType" "CategoryRuleMatch" NOT NULL DEFAULT 'CONTAINS',
    "type" "TransactionType",
    "category" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DismissedSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryRule_userId_idx" ON "CategoryRule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DismissedSuggestion_userId_key_key" ON "DismissedSuggestion"("userId", "key");

-- AddForeignKey
ALTER TABLE "CategoryRule" ADD CONSTRAINT "CategoryRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DismissedSuggestion" ADD CONSTRAINT "DismissedSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

