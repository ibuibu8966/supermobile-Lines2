-- AlterEnum
ALTER TYPE "KycImageType" ADD VALUE 'CORPORATE_REGISTRY';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "comment1" TEXT,
ADD COLUMN     "comment2" TEXT;

-- AlterTable
ALTER TABLE "ApplicationLine" ADD COLUMN     "contractMonth" TIMESTAMP(3),
ADD COLUMN     "lineReserveTagId" INTEGER,
ADD COLUMN     "lineTagId" INTEGER;

-- AlterTable
ALTER TABLE "KycImage" ADD COLUMN     "expiryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Sim" ADD COLUMN     "simLocationTagId" INTEGER;

-- CreateTable
CREATE TABLE "SimLocationTag" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimLocationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineTag" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineReserveTag" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineReserveTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SimLocationTag_code_key" ON "SimLocationTag"("code");

-- CreateIndex
CREATE INDEX "SimLocationTag_isActive_idx" ON "SimLocationTag"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LineTag_code_key" ON "LineTag"("code");

-- CreateIndex
CREATE INDEX "LineTag_isActive_idx" ON "LineTag"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LineReserveTag_code_key" ON "LineReserveTag"("code");

-- CreateIndex
CREATE INDEX "LineReserveTag_isActive_idx" ON "LineReserveTag"("isActive");

-- CreateIndex
CREATE INDEX "ApplicationLine_lineTagId_idx" ON "ApplicationLine"("lineTagId");

-- CreateIndex
CREATE INDEX "ApplicationLine_lineReserveTagId_idx" ON "ApplicationLine"("lineReserveTagId");

-- CreateIndex
CREATE INDEX "Sim_simLocationTagId_idx" ON "Sim"("simLocationTagId");

-- AddForeignKey
ALTER TABLE "Sim" ADD CONSTRAINT "Sim_simLocationTagId_fkey" FOREIGN KEY ("simLocationTagId") REFERENCES "SimLocationTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLine" ADD CONSTRAINT "ApplicationLine_lineTagId_fkey" FOREIGN KEY ("lineTagId") REFERENCES "LineTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLine" ADD CONSTRAINT "ApplicationLine_lineReserveTagId_fkey" FOREIGN KEY ("lineReserveTagId") REFERENCES "LineReserveTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
