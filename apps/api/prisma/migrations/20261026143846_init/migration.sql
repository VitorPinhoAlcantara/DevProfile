-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('OPEN_TO_WORK', 'NOT_LOOKING');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'LINKEDIN', 'GITHUB', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'FREELANCE', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "ProjectLinkKind" AS ENUM ('REPOSITORY', 'WEBSITE', 'DEMO', 'STORE', 'DOCS');

-- CreateEnum
CREATE TYPE "LanguageLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'FLUENT', 'NATIVE');

-- CreateEnum
CREATE TYPE "CvProfile" AS ENUM ('JUNIOR', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'REORDER', 'RESTORE');

-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "fullName" TEXT NOT NULL,
    "headlinePt" TEXT NOT NULL,
    "headlineEn" TEXT NOT NULL,
    "locationPt" TEXT NOT NULL,
    "locationEn" TEXT NOT NULL,
    "summaryPt" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "cvSummaryPt" TEXT NOT NULL,
    "cvSummaryEn" TEXT NOT NULL,
    "cvObjectivePt" TEXT NOT NULL,
    "cvObjectiveEn" TEXT NOT NULL,
    "availability" "AvailabilityStatus" NOT NULL,
    "workModes" "WorkMode"[],
    "availabilityNotePt" TEXT NOT NULL,
    "availabilityNoteEn" TEXT NOT NULL,
    "photoId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactChannel" (
    "id" TEXT NOT NULL,
    "kind" "ContactKind" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnCv" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnCv" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyUrl" TEXT,
    "rolePt" TEXT NOT NULL,
    "roleEn" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "location" TEXT,
    "workMode" "WorkMode",
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "summaryPt" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "cvBulletsPt" TEXT[],
    "cvBulletsEn" TEXT[],
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnCv" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taglinePt" TEXT NOT NULL,
    "taglineEn" TEXT NOT NULL,
    "summaryPt" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "cvBulletsPt" TEXT[],
    "cvBulletsEn" TEXT[],
    "startDate" TEXT,
    "endDate" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "coverId" TEXT,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnCv" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "ProjectLinkKind" NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProjectLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "institutionShort" TEXT,
    "degreePt" TEXT NOT NULL,
    "degreeEn" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "endIsExpected" BOOLEAN NOT NULL DEFAULT false,
    "summaryPt" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnCv" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issuedAt" TEXT NOT NULL,
    "expiresAt" TEXT,
    "credentialUrl" TEXT,
    "notePt" TEXT NOT NULL,
    "noteEn" TEXT NOT NULL,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnCv" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "level" "LanguageLevel" NOT NULL,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnCv" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cvProfile" "CvProfile" NOT NULL DEFAULT 'JUNIOR',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altPt" TEXT,
    "altEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "totpSecret" TEXT,
    "totpEnabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExperienceToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExperienceToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_photoId_key" ON "Profile"("photoId");

-- CreateIndex
CREATE INDEX "ContactChannel_position_idx" ON "ContactChannel"("position");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategory_key_key" ON "SkillCategory"("key");

-- CreateIndex
CREATE INDEX "SkillCategory_position_idx" ON "SkillCategory"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_categoryId_position_idx" ON "Skill"("categoryId", "position");

-- CreateIndex
CREATE INDEX "Experience_position_idx" ON "Experience"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_coverId_key" ON "Project"("coverId");

-- CreateIndex
CREATE INDEX "Project_position_idx" ON "Project"("position");

-- CreateIndex
CREATE INDEX "ProjectLink_projectId_position_idx" ON "ProjectLink"("projectId", "position");

-- CreateIndex
CREATE INDEX "Education_position_idx" ON "Education"("position");

-- CreateIndex
CREATE INDEX "Certification_position_idx" ON "Certification"("position");

-- CreateIndex
CREATE INDEX "Language_position_idx" ON "Language"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Media_storageKey_key" ON "Media"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "_ExperienceToSkill_B_index" ON "_ExperienceToSkill"("B");

-- CreateIndex
CREATE INDEX "_ProjectToSkill_B_index" ON "_ProjectToSkill"("B");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SkillCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLink" ADD CONSTRAINT "ProjectLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExperienceToSkill" ADD CONSTRAINT "_ExperienceToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExperienceToSkill" ADD CONSTRAINT "_ExperienceToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
