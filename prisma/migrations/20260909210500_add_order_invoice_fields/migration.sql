ALTER TABLE "orders"
  ADD COLUMN "invoiceType" TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN "identityNumber" TEXT,
  ADD COLUMN "companyName" TEXT,
  ADD COLUMN "taxNumber" TEXT,
  ADD COLUMN "taxOffice" TEXT,
  ADD COLUMN "billingSameAsShipping" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "billingCity" TEXT,
  ADD COLUMN "billingDistrict" TEXT,
  ADD COLUMN "billingPostalCode" TEXT,
  ADD COLUMN "billingAddressLine" TEXT;
