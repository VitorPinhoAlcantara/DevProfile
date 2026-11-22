-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT,
    "destination" TEXT NOT NULL DEFAULT '/',
    "note" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_slug_key" ON "ShortLink"("slug");

-- Default links: the public CV and the two profiles that point back to the site.
INSERT INTO "ShortLink" ("id", "slug", "source", "medium", "note") VALUES
    (gen_random_uuid()::text, 'curriculo', 'curriculo', 'curriculo', 'Currículo baixado pelo site'),
    (gen_random_uuid()::text, 'linkedin', 'linkedin', 'social', 'Link no perfil do LinkedIn'),
    (gen_random_uuid()::text, 'github', 'github', 'social', 'Link no perfil e nos READMEs do GitHub');
