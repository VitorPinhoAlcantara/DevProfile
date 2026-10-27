import { Award, ExternalLink, GraduationCap, Languages } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type {
  Locale,
  PublicCertification,
  PublicEducation,
  PublicLanguage,
} from '@devprofile/shared';
import { Section } from '@/components/ui/section';
import { formatPartialDate, formatPeriod } from '@/lib/format';
import { sections } from '@/lib/sections';

export async function EducationSection({
  education,
  certifications,
  languages,
}: {
  education: PublicEducation[];
  certifications: PublicCertification[];
  languages: PublicLanguage[];
}) {
  const t = await getTranslations('education');
  const tNav = await getTranslations('nav');
  const tExp = await getTranslations('experience');
  const locale = (await getLocale()) as Locale;

  return (
    <Section section={sections[4]} title={tNav('education')}>
      <ul className="space-y-5">
        {education.map((item) => (
          <li
            key={`${item.institution}-${item.period.start}`}
            className="flex gap-3"
          >
            <GraduationCap
              className="mt-0.5 size-5 shrink-0 text-accent"
              aria-hidden
            />
            <div>
              <h3 className="font-semibold text-fg">{item.degree}</h3>
              <p className="text-sm text-muted">
                {item.institution}
                {item.institutionShort && ` (${item.institutionShort})`}
              </p>
              <p className="mt-1 font-mono text-xs text-soft">
                {formatPeriod(item.period, locale, tExp('present'))}
                {item.endIsExpected && ` (${t('expected')})`}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                {item.summary}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {certifications.length > 0 && (
        <>
          <h3 className="mt-8 mb-3 text-sm font-medium text-fg">
            {t('certifications')}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {certifications.map((cert) => (
              <li
                key={cert.name}
                className="flex gap-3 rounded-lg border border-line bg-panel p-4"
              >
                <Award
                  className="mt-0.5 size-5 shrink-0 text-post"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-medium text-fg">
                    {cert.credentialUrl ? (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {cert.name}
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      cert.name
                    )}
                  </p>
                  <p className="text-sm text-muted">
                    {t('issuedBy', { issuer: cert.issuer })}
                  </p>
                  <p className="mt-1 font-mono text-xs text-soft">
                    {formatPartialDate(cert.issuedAt, locale)}
                    {cert.expiresAt &&
                      ` · ${t('validUntil', { date: formatPartialDate(cert.expiresAt, locale) })}`}
                  </p>
                  <p className="mt-2 text-sm text-muted">{cert.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {languages.length > 0 && (
        <>
          <h3 className="mt-8 mb-3 text-sm font-medium text-fg">
            {t('languages')}
          </h3>
          <ul className="flex flex-wrap gap-3">
            {languages.map((language) => (
              <li
                key={language.name}
                className="flex items-center gap-2 text-sm text-muted"
              >
                <Languages className="size-4 text-soft" aria-hidden />
                <span className="text-fg">{language.name}</span>
                <span className="text-soft">
                  — {t(`levels.${language.level}`)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
