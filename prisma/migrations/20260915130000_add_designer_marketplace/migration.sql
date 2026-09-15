-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "approvalStatus" "ProductApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "designerId" TEXT;

-- CreateTable
CREATE TABLE "designer_applications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "otherCategory" TEXT,
    "message" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designers" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "commissionPct" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shipViolationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "designer_applications_email_key" ON "designer_applications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "designers_applicationId_key" ON "designers"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "designers_email_key" ON "designers"("email");

-- CreateIndex
CREATE INDEX "payout_requests_designerId_idx" ON "payout_requests"("designerId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "designers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designers" ADD CONSTRAINT "designers_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "designer_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "designers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

