-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('CSV', 'GOOGLE_SHEETS');

-- AlterTable
ALTER TABLE "supplier_products" ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "autoSync" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feedType" "FeedType" NOT NULL DEFAULT 'CSV',
ADD COLUMN     "feedUrl" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);
