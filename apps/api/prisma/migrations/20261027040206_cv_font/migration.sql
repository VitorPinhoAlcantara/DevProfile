-- CreateEnum
CREATE TYPE "CvFont" AS ENUM ('SANS', 'SERIF');

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "cvFont" "CvFont" NOT NULL DEFAULT 'SANS';
