-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "importHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_importHash_key" ON "Transaction"("importHash");
