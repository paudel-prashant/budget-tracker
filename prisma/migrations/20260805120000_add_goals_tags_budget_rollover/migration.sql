-- Purely additive: new Goal table, new Transaction.tags column, new Budget.rolloverEnabled column.
-- Deliberately hand-written (not `prisma migrate dev`) to avoid touching unrelated
-- pre-existing schema drift (FinanceAccount.isDefault exists live but isn't in
-- schema.prisma / migration history) that predates this migration.

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN "rolloverEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
