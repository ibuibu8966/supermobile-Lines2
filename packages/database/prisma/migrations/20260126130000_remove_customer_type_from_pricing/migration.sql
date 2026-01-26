-- Remove customerType from PlanPricing
-- This migration removes the individual/corporate distinction from pricing
-- All customers now share the same tier-based pricing

-- First, handle any duplicate minQuantity records by keeping the lower price
DELETE FROM "PlanPricing" p1
WHERE EXISTS (
  SELECT 1 FROM "PlanPricing" p2
  WHERE p1."planId" = p2."planId"
    AND p1."minQuantity" = p2."minQuantity"
    AND p1."unitPrice" > p2."unitPrice"
);

-- Drop the customerType index if it exists
DROP INDEX IF EXISTS "PlanPricing_customerType_idx";

-- Remove the customerType column
ALTER TABLE "PlanPricing" DROP COLUMN IF EXISTS "customerType";
