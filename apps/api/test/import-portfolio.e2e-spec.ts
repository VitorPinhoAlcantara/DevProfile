import { inject } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { portfolioSchema } from '@devprofile/shared';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { importPortfolio } from '../src/content/import-portfolio.js';
import { portfolioSeed } from '../prisma/seed-data.js';

describe('importPortfolio (e2e)', () => {
  const content = portfolioSchema.parse(portfolioSeed);
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: inject('databaseUrl') }),
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('loads the seed with relations and display order', async () => {
    await importPortfolio(prisma, content);

    const projects = await prisma.project.findMany({
      orderBy: { position: 'asc' },
      include: {
        links: { orderBy: { position: 'asc' } },
        skills: { select: { name: true } },
      },
    });
    expect(projects.map((p) => p.slug)).toEqual(
      content.projects.map((p) => p.slug),
    );

    const streetUrban = projects.find((p) => p.slug === 'streeturban')!;
    expect(streetUrban.skills.map((s) => s.name).sort()).toEqual(
      [
        ...content.projects.find((p) => p.slug === 'streeturban')!.skills,
      ].sort(),
    );
    expect(streetUrban.links[0]?.kind).toBe('WEBSITE');

    const profile = await prisma.profile.findUniqueOrThrow({
      where: { id: 1 },
    });
    expect(profile.locationPt).toBe('Aracaju – SE, Brasil');
  });

  it('can run again without duplicating rows', async () => {
    await importPortfolio(prisma, content);
    await importPortfolio(prisma, content);

    const totalSkills = content.skillCategories.reduce(
      (sum, c) => sum + c.skills.length,
      0,
    );
    expect(await prisma.skill.count()).toBe(totalSkills);
    expect(await prisma.project.count()).toBe(content.projects.length);
    expect(await prisma.contactChannel.count()).toBe(content.contacts.length);
    expect(await prisma.profile.count()).toBe(1);
  });
});
