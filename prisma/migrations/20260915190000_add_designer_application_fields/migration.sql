-- AlterTable
ALTER TABLE "designer_applications" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "companySize" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "referralSource" TEXT NOT NULL,
ALTER COLUMN "message" DROP NOT NULL;

-- AlterTable
ALTER TABLE "designers" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "instagram" TEXT;

