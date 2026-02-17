-- AlterEnum: Add 'BOTH' to SimType
ALTER TYPE "SimType" ADD VALUE 'BOTH';

-- DropIndex: Remove isMnpEligible index
DROP INDEX IF EXISTS "Sim_isMnpEligible_idx";

-- AlterTable: Remove MNP related columns from Sim
ALTER TABLE "Sim" DROP COLUMN IF EXISTS "isMnpEligible",
DROP COLUMN IF EXISTS "mnpReservationNumber",
DROP COLUMN IF EXISTS "mnpExpiryDate";
