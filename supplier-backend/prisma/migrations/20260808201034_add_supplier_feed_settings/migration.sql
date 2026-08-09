-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "customMapping" JSONB,
ADD COLUMN     "sheetGid" TEXT,
ADD COLUMN     "startRow" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "stopWords" TEXT;
