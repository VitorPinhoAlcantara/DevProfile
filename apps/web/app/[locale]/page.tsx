import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@devprofile/shared';
import { AboutSection } from '@/components/sections/about';
import { ContactSection } from '@/components/sections/contact';
import { EducationSection } from '@/components/sections/education';
import { ExperienceSection } from '@/components/sections/experience';
import { ProjectsSection } from '@/components/sections/projects';
import { SkillsSection } from '@/components/sections/skills';
import { WorkspaceShell } from '@/components/workspace-shell';
import { getPortfolio } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

// Content comes from the API at request time (cached for 60 s), never at build time.
export const dynamic = 'force-dynamic';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { data: portfolio, meta } = await getPortfolio(locale);
  const { profile, contacts } = portfolio;

  // schema.org Person, so search engines can show name, role and profiles.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.fullName,
    jobTitle: profile.headline,
    url: SITE_URL,
    image: `${SITE_URL}${profile.photoUrl ?? '/profile-photo.jpeg'}`,
    address: { '@type': 'PostalAddress', addressLocality: profile.location },
    sameAs: contacts
      .filter((c) => c.kind === 'LINKEDIN' || c.kind === 'GITHUB')
      .map((c) => c.href),
  };

  return (
    <WorkspaceShell portfolio={portfolio} meta={meta}>
      <AboutSection portfolio={portfolio} />
      <ExperienceSection items={portfolio.experience} />
      <ProjectsSection items={portfolio.projects} />
      <SkillsSection categories={portfolio.skills} />
      <EducationSection
        education={portfolio.education}
        certifications={portfolio.certifications}
        languages={portfolio.languages}
      />
      <ContactSection contacts={contacts} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </WorkspaceShell>
  );
}
