-- CreateEnum
CREATE TYPE "KycVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "kycStatus" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false;
