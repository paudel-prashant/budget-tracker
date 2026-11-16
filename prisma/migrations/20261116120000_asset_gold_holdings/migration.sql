-- Purely additive: gold holding fields on Asset (all nullable).
-- Hand-written; apply with `npm run db:migrate:deploy`,
-- never `prisma migrate dev` (see 20260805120000 re: drift).

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "goldGrams" DOUBLE PRECISION,
ADD COLUMN     "goldPurity" DOUBLE PRECISION,
ADD COLUMN     "costBasis" DOUBLE PRECISION;
