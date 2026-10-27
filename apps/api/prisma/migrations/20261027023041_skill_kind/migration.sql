-- CreateEnum
CREATE TYPE "SkillKind" AS ENUM ('TECHNICAL', 'SOFT');

-- AlterTable
ALTER TABLE "SkillCategory" ADD COLUMN     "kind" "SkillKind" NOT NULL DEFAULT 'TECHNICAL';

-- The soft skills category created by the seed (and edited in the admin) becomes SOFT.
UPDATE "SkillCategory" SET "kind" = 'SOFT' WHERE "key" = 'comportamentais';
