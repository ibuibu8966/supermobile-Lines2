-- ステータス設計の整理

-- =============================================
-- Step 1: 新しいPaymentStatus enumを作成
-- =============================================
CREATE TYPE "PaymentStatus" AS ENUM ('BEFORE_INVOICE', 'INVOICED', 'PAID');

-- ApplicationにpaymentStatusカラムを追加
ALTER TABLE "Application" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'BEFORE_INVOICE';

-- 既存のpaymentConfirmedデータをpaymentStatusに移行
UPDATE "Application" SET "paymentStatus" = 'PAID' WHERE "paymentConfirmed" = true;
UPDATE "Application" SET "paymentStatus" = 'INVOICED'
WHERE "paymentConfirmed" = false AND "status" IN ('PAYMENT_PENDING', 'PAID', 'SHIPPING', 'COMPLETED');

-- paymentConfirmedカラムを削除
ALTER TABLE "Application" DROP COLUMN "paymentConfirmed";

-- =============================================
-- Step 2: KycVerificationStatusを更新
-- =============================================

-- 既存データをテキストで一時保存
ALTER TABLE "Application" ADD COLUMN "kycStatus_temp" TEXT;
UPDATE "Application" SET "kycStatus_temp" =
  CASE
    WHEN "kycStatus"::text = 'APPROVED' THEN 'COMPLETED'
    WHEN "kycStatus"::text = 'REJECTED' THEN 'DEFICIENT'
    ELSE "kycStatus"::text
  END;

-- 古いカラムを削除
ALTER TABLE "Application" DROP COLUMN "kycStatus";

-- 古いenum型を削除して新しいものを作成
DROP TYPE "KycVerificationStatus";
CREATE TYPE "KycVerificationStatus" AS ENUM ('PENDING', 'DEFICIENT', 'RESUBMIT', 'COMPLETED');

-- 新しいカラムを作成してデータを復元
ALTER TABLE "Application" ADD COLUMN "kycStatus" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "Application" SET "kycStatus" = "kycStatus_temp"::"KycVerificationStatus";
ALTER TABLE "Application" DROP COLUMN "kycStatus_temp";

-- =============================================
-- Step 3: ApplicationLineStatusを更新
-- =============================================

-- 既存データをテキストで一時保存
ALTER TABLE "ApplicationLine" ADD COLUMN "status_temp" TEXT;
UPDATE "ApplicationLine" SET "status_temp" =
  CASE
    WHEN "status"::text = 'UNASSIGNED' THEN 'NOT_ACTIVATED'
    WHEN "status"::text = 'ASSIGNED' THEN 'NOT_ACTIVATED'
    WHEN "status"::text = 'ACTIVE' THEN 'ACTIVATED'
    ELSE "status"::text
  END;

-- インデックスを削除
DROP INDEX IF EXISTS "ApplicationLine_status_idx";

-- 古いカラムを削除
ALTER TABLE "ApplicationLine" DROP COLUMN "status";

-- 古いenum型を削除して新しいものを作成
DROP TYPE "ApplicationLineStatus";
CREATE TYPE "ApplicationLineStatus" AS ENUM ('NOT_ACTIVATED', 'ACTIVATED', 'SHIPPED', 'RETURNED', 'CANCELLED');

-- 新しいカラムを作成してデータを復元
ALTER TABLE "ApplicationLine" ADD COLUMN "status" "ApplicationLineStatus" NOT NULL DEFAULT 'NOT_ACTIVATED';
UPDATE "ApplicationLine" SET "status" = "status_temp"::"ApplicationLineStatus";
ALTER TABLE "ApplicationLine" DROP COLUMN "status_temp";

-- インデックスを再作成
CREATE INDEX "ApplicationLine_status_idx" ON "ApplicationLine"("status");

-- =============================================
-- Step 4: ApplicationStatusを更新（KYC関連の値を削除）
-- =============================================

-- 既存データをテキストで一時保存
ALTER TABLE "Application" ADD COLUMN "status_temp" TEXT;
UPDATE "Application" SET "status_temp" =
  CASE
    WHEN "status"::text = 'KYC_PENDING' THEN 'SUBMITTED'
    WHEN "status"::text = 'KYC_APPROVED' THEN 'PAYMENT_PENDING'
    WHEN "status"::text = 'KYC_REJECTED' THEN 'CANCELLED'
    ELSE "status"::text
  END;

-- インデックスを削除
DROP INDEX IF EXISTS "Application_status_idx";

-- 古いカラムを削除
ALTER TABLE "Application" DROP COLUMN "status";

-- 古いenum型を削除して新しいものを作成
DROP TYPE "ApplicationStatus";
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'PAYMENT_PENDING', 'PAID', 'SHIPPING', 'COMPLETED', 'CANCELLED');

-- 新しいカラムを作成してデータを復元
ALTER TABLE "Application" ADD COLUMN "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED';
UPDATE "Application" SET "status" = "status_temp"::"ApplicationStatus";
ALTER TABLE "Application" DROP COLUMN "status_temp";

-- インデックスを再作成
CREATE INDEX "Application_status_idx" ON "Application"("status");
