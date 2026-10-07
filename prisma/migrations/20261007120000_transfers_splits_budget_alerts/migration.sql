-- Purely additive: budget carry-over/alert settings, account opening balances, split
-- transactions, and the new Transfer / BudgetAlertLog / PushSubscription tables.
-- Hand-written from `prisma migrate diff` (old schema -> new schema) rather than
-- `prisma migrate dev`, for the same reason as 20260805120000 (pre-existing drift on
-- FinanceAccount.isDefault must not be touched).

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "budgetAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "budgetCarryOverEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "budgetCarryOverMonth" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "splitGroupId" TEXT;

-- AlterTable
ALTER TABLE "FinanceAccount" ADD COLUMN     "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAlertLog" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetAlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transfer_userId_date_idx" ON "Transfer"("userId", "date" DESC);

-- CreateIndex
CREATE INDEX "Transfer_fromAccountId_idx" ON "Transfer"("fromAccountId");

-- CreateIndex
CREATE INDEX "Transfer_toAccountId_idx" ON "Transfer"("toAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAlertLog_budgetId_threshold_key" ON "BudgetAlertLog"("budgetId", "threshold");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Transaction_splitGroupId_idx" ON "Transaction"("splitGroupId");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "FinanceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "FinanceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAlertLog" ADD CONSTRAINT "BudgetAlertLog_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

