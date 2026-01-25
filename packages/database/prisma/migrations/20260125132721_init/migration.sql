-- CreateEnum
CREATE TYPE "SimStatus" AS ENUM ('IN_STOCK', 'ACTIVE', 'RETURNING', 'RETIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SimType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "CarrierType" AS ENUM ('DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SHIPPED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'KYC_PENDING', 'KYC_APPROVED', 'KYC_REJECTED', 'PAYMENT_PENDING', 'PAID', 'SHIPPING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationLineStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'SHIPPED', 'ACTIVE', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "KycImageType" AS ENUM ('ID_FRONT', 'ID_BACK', 'SELFIE', 'ADDRESS_PROOF');

-- CreateEnum
CREATE TYPE "KycImageStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sim" (
    "iccid" VARCHAR(20) NOT NULL,
    "msisdn" VARCHAR(20),
    "supplierId" INTEGER NOT NULL,
    "simType" "SimType" NOT NULL DEFAULT 'INDIVIDUAL',
    "carrierType" "CarrierType",
    "plan" VARCHAR(100),
    "supplierContractStart" TIMESTAMP(3),
    "supplierContractEnd" TIMESTAMP(3),
    "isMnpEligible" BOOLEAN NOT NULL DEFAULT false,
    "mnpReservationNumber" VARCHAR(20),
    "mnpExpiryDate" TIMESTAMP(3),
    "isAutoCancel" BOOLEAN NOT NULL DEFAULT false,
    "autoCancelDate" TIMESTAMP(3),
    "currentContractId" VARCHAR(30),
    "status" "SimStatus" NOT NULL DEFAULT 'IN_STOCK',
    "consumedTagIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sim_pkey" PRIMARY KEY ("iccid")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "iccid" VARCHAR(20) NOT NULL,
    "serviceName" VARCHAR(50) NOT NULL,
    "customerId" TEXT,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "shippedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "msisdnSnapshot" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTag" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractUsageTag" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "usageTagId" INTEGER NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ContractUsageTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRule" (
    "id" SERIAL NOT NULL,
    "usageTagId" INTEGER NOT NULL,
    "supplierFilter" VARCHAR(50),
    "carrierFilter" "CarrierType",
    "planFilter" VARCHAR(100),
    "excludedTagIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "minContractDays" INTEGER NOT NULL DEFAULT 0,
    "requiresMnp" BOOLEAN NOT NULL DEFAULT false,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "serviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "email" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastNameKana" VARCHAR(50) NOT NULL,
    "firstNameKana" VARCHAR(50) NOT NULL,
    "birthDate" TIMESTAMP(3),
    "postalCode" VARCHAR(10) NOT NULL,
    "prefecture" VARCHAR(20) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "building" VARCHAR(200),
    "companyName" VARCHAR(100),
    "companyNameKana" VARCHAR(100),
    "establishedDate" TIMESTAMP(3),
    "companyPostalCode" VARCHAR(10),
    "companyPrefecture" VARCHAR(20),
    "companyCity" VARCHAR(100),
    "companyAddress" VARCHAR(200),
    "companyBuilding" VARCHAR(200),
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanUsageTag" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "usageTagId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanUsageTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPricing" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerType" "CustomerType" NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "unitPrice" INTEGER NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationNumber" VARCHAR(20) NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "lineCount" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLine" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "simId" VARCHAR(20),
    "contractId" TEXT,
    "msisdn" VARCHAR(20),
    "status" "ApplicationLineStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "shippedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycImage" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "KycImageType" NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "status" "KycImageStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE INDEX "Sim_status_idx" ON "Sim"("status");

-- CreateIndex
CREATE INDEX "Sim_supplierId_idx" ON "Sim"("supplierId");

-- CreateIndex
CREATE INDEX "Sim_msisdn_idx" ON "Sim"("msisdn");

-- CreateIndex
CREATE INDEX "Sim_simType_idx" ON "Sim"("simType");

-- CreateIndex
CREATE INDEX "Sim_isMnpEligible_idx" ON "Sim"("isMnpEligible");

-- CreateIndex
CREATE INDEX "Sim_carrierType_idx" ON "Sim"("carrierType");

-- CreateIndex
CREATE INDEX "Contract_iccid_idx" ON "Contract"("iccid");

-- CreateIndex
CREATE INDEX "Contract_serviceName_idx" ON "Contract"("serviceName");

-- CreateIndex
CREATE INDEX "Contract_customerId_idx" ON "Contract"("customerId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_contractStart_contractEnd_idx" ON "Contract"("contractStart", "contractEnd");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTag_code_key" ON "UsageTag"("code");

-- CreateIndex
CREATE INDEX "UsageTag_isActive_idx" ON "UsageTag"("isActive");

-- CreateIndex
CREATE INDEX "UsageTag_category_idx" ON "UsageTag"("category");

-- CreateIndex
CREATE INDEX "ContractUsageTag_usageTagId_idx" ON "ContractUsageTag"("usageTagId");

-- CreateIndex
CREATE INDEX "ContractUsageTag_appliedAt_idx" ON "ContractUsageTag"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContractUsageTag_contractId_usageTagId_key" ON "ContractUsageTag"("contractId", "usageTagId");

-- CreateIndex
CREATE INDEX "UsageRule_usageTagId_idx" ON "UsageRule"("usageTagId");

-- CreateIndex
CREATE INDEX "UsageRule_priority_idx" ON "UsageRule"("priority");

-- CreateIndex
CREATE INDEX "UsageRule_isActive_idx" ON "UsageRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_serviceId_idx" ON "User"("serviceId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_type_idx" ON "Customer"("type");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Plan_serviceId_idx" ON "Plan"("serviceId");

-- CreateIndex
CREATE INDEX "Plan_isActive_idx" ON "Plan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_serviceId_code_key" ON "Plan"("serviceId", "code");

-- CreateIndex
CREATE INDEX "PlanUsageTag_usageTagId_idx" ON "PlanUsageTag"("usageTagId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanUsageTag_planId_usageTagId_key" ON "PlanUsageTag"("planId", "usageTagId");

-- CreateIndex
CREATE INDEX "PlanPricing_planId_idx" ON "PlanPricing"("planId");

-- CreateIndex
CREATE INDEX "PlanPricing_customerType_idx" ON "PlanPricing"("customerType");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNumber_key" ON "Application"("applicationNumber");

-- CreateIndex
CREATE INDEX "Application_customerId_idx" ON "Application"("customerId");

-- CreateIndex
CREATE INDEX "Application_serviceId_idx" ON "Application"("serviceId");

-- CreateIndex
CREATE INDEX "Application_planId_idx" ON "Application"("planId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationLine_applicationId_idx" ON "ApplicationLine"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationLine_simId_idx" ON "ApplicationLine"("simId");

-- CreateIndex
CREATE INDEX "ApplicationLine_contractId_idx" ON "ApplicationLine"("contractId");

-- CreateIndex
CREATE INDEX "ApplicationLine_status_idx" ON "ApplicationLine"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationLine_applicationId_lineNumber_key" ON "ApplicationLine"("applicationId", "lineNumber");

-- CreateIndex
CREATE INDEX "KycImage_applicationId_idx" ON "KycImage"("applicationId");

-- CreateIndex
CREATE INDEX "KycImage_status_idx" ON "KycImage"("status");

-- AddForeignKey
ALTER TABLE "Sim" ADD CONSTRAINT "Sim_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_iccid_fkey" FOREIGN KEY ("iccid") REFERENCES "Sim"("iccid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractUsageTag" ADD CONSTRAINT "ContractUsageTag_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractUsageTag" ADD CONSTRAINT "ContractUsageTag_usageTagId_fkey" FOREIGN KEY ("usageTagId") REFERENCES "UsageTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRule" ADD CONSTRAINT "UsageRule_usageTagId_fkey" FOREIGN KEY ("usageTagId") REFERENCES "UsageTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanUsageTag" ADD CONSTRAINT "PlanUsageTag_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanUsageTag" ADD CONSTRAINT "PlanUsageTag_usageTagId_fkey" FOREIGN KEY ("usageTagId") REFERENCES "UsageTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPricing" ADD CONSTRAINT "PlanPricing_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLine" ADD CONSTRAINT "ApplicationLine_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLine" ADD CONSTRAINT "ApplicationLine_simId_fkey" FOREIGN KEY ("simId") REFERENCES "Sim"("iccid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLine" ADD CONSTRAINT "ApplicationLine_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycImage" ADD CONSTRAINT "KycImage_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
