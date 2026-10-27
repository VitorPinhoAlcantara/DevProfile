import { Download, MapPin } from 'lucide-react';
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import type { PublicPortfolio } from '@devprofile/shared';
import { ContactIcon, isExternal } from '@/components/ui/contact-icon';
import { Section } from '@/components/ui/section';
import { trackClick } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { sections } from '@/lib/sections';
import { DEFAULT_PHOTO } from '@/lib/site';

/** Hero: who, what, where, availability and how to reach out — readable in seconds. */
export async function AboutSection({
  portfolio,
}: {
  portfolio: PublicPortfolio;
}) {
  const t = await getTranslations('hero');
  const tNav = await getTranslations('nav');
  const { profile, contacts } = portfolio;
  const openToWork = profile.availability.status === 'OPEN_TO_WORK';
  const workModes = profile.availability.workModes
    .map((mode) => t(`workModes.${mode}`))
    .join(' · ');
  const heroContacts = contacts
    .filter((c) => c.kind !== 'PHONE' && c.kind !== 'WHATSAPP')
    .slice(0, 3);
  const locale = await getLocale();

  const metrics = [
    {
      count: portfolio.experience.length,
      label: t('metrics.experience', { count: portfolio.experience.length }),
    },
    {
      count: portfolio.projects.length,
      label: t('metrics.projects', { count: portfolio.projects.length }),
    },
    {
      count: portfolio.certifications.length,
      label: t('metrics.certifications', {
        count: portfolio.certifications.length,
      }),
    },
  ];

  return (
    <Section section={sections[0]} title={tNav('about')} hideTitle>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Image
          src={profile.photoUrl ?? DEFAULT_PHOTO}
          alt={t('photoAlt', { name: profile.fullName })}
          width={112}
          height={112}
          priority
          // Uploaded photos live behind /api (Caddy -> api), which Next's image
          // optimizer can't fetch from inside the web container.
          unoptimized={profile.photoUrl !== null}
          className="size-24 shrink-0 rounded-full border border-line object-cover sm:size-28"
        />
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            {profile.fullName}
          </h1>
          <p className="text-base text-muted sm:text-lg">{profile.headline}</p>
          <p className="flex items-center gap-1.5 text-sm text-soft">
            <MapPin className="size-3.5" aria-hidden />
            {profile.location}
          </p>
          <p
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm',
              openToWork ? 'bg-get-soft text-get' : 'bg-panel-2 text-muted',
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                openToWork ? 'bg-get' : 'bg-soft',
              )}
              aria-hidden
            />
            {openToWork ? t('openToWork') : t('notLooking')}
            {openToWork && workModes && (
              <span className="hidden text-get/80 sm:inline">
                · {workModes}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* The CV is the main action for recruiters; the phone stays in Contato. */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={`/api/v1/cv?lang=${locale}`}
          download
          {...trackClick('cv-download', { lang: locale, place: 'hero' })}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-accent bg-accent px-3.5 text-sm font-medium text-on-accent transition hover:opacity-90"
        >
          <Download className="size-4" aria-hidden />
          {t('downloadCv')}
        </a>
        {heroContacts.map((contact) => (
          <ContactButton
            key={contact.href}
            contact={contact}
            className="border-line-strong text-fg hover:bg-panel-2"
          />
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-panel px-3 py-2.5">
            <dd className="text-xl font-semibold text-fg">{metric.count}</dd>
            <dt className="text-xs text-soft">{metric.label}</dt>
          </div>
        ))}
      </dl>

      <p className="mt-6 max-w-3xl leading-relaxed text-muted">
        {profile.summary}
      </p>
    </Section>
  );
}

function ContactButton({
  contact,
  className,
}: {
  contact: PublicPortfolio['contacts'][number];
  className: string;
}) {
  const external = isExternal(contact.href);
  return (
    <a
      href={contact.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...trackClick('contact-click', { kind: contact.kind, place: 'hero' })}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition',
        className,
      )}
    >
      <ContactIcon kind={contact.kind} className="size-4" />
      {contact.label}
    </a>
  );
}
