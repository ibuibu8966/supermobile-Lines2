-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Application_isArchived_idx" ON "Application"("isArchived");
