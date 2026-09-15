-- AlterTable
ALTER TABLE "designer_applications" ADD COLUMN     "brandName" TEXT NOT NULL,
ADD COLUMN     "canInvoice" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "designers" ADD COLUMN     "brandName" TEXT NOT NULL,
ADD COLUMN     "canInvoice" BOOLEAN NOT NULL;

