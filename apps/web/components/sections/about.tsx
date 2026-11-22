import { ArrowRight, Download, Globe, MapPin } from 'lucide-react';
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import type { PublicPortfolio } from '@devprofile/shared';
import { ContactIcon, isExternal } from '@/components/ui/contact-icon';
import { Section } from '@/components/ui/section';
import { Link } from '@/i18n/navigation';
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

  const featured = portfolio.projects.filter((p) => p.featured).slice(0, 3);

  return (
    <Section section={sections[0]} title={tNav('about')} hideTitle>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Image
          // Shown at 112 px at most; 320 keeps it sharp on 3x screens.
          src={profile.photoUrl ? `${profile.photoUrl}?w=320` : DEFAULT_PHOTO}
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
          className="inline-flex h-9 items-center gap-2 rounded-md border border-accent bg-accent px-3.5 text-sm font-medium text-on-accent transition hover:opacity-90 pointer-coarse:h-11"
        >
          <Download className="size-4" aria-hidden />
          {t('downloadCv')}
        </a>
        {/* E-mail keeps its label; profile links become icon buttons to cut the choices to two. */}
        {heroContacts.map((contact) => (
          <ContactButton
            key={contact.href}
            contact={contact}
            iconOnly={contact.kind !== 'EMAIL'}
            className="border-line-strong text-fg hover:bg-panel-2"
          />
        ))}
      </div>

      {featured.length > 0 && (
        <div className="mt-8 sm:max-w-2xl">
          <h2 className="text-sm font-medium text-muted">{t('featured')}</h2>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-panel">
            {featured.map((project) => {
              const site = project.links.find((l) => l.kind === 'WEBSITE');
              return (
                <li
                  key={project.slug}
                  className="group relative flex items-center gap-4 px-4 py-3 transition hover:bg-panel-2"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="font-medium text-fg after:absolute after:inset-0"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted sm:line-clamp-1">
                      {project.tagline}
                    </p>
                  </div>
                  {site && (
                    <a
                      href={site.href}
                      target="_blank"
                      rel="noreferrer"
                      {...trackClick('project-link', {
                        project: project.slug,
                        kind: site.kind,
                        place: 'hero',
                      })}
                      className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-get-soft px-2.5 py-1 text-xs font-medium text-get hover:underline pointer-coarse:min-h-11"
                    >
                      <Globe className="size-3.5" aria-hidden />
                      {t('live')}
                    </a>
                  )}
                  <ArrowRight
                    className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-6 max-w-[60ch] leading-relaxed text-muted">
        {profile.summary}
      </p>
    </Section>
  );
}

function ContactButton({
  contact,
  className,
  iconOnly = false,
}: {
  contact: PublicPortfolio['contacts'][number];
  className: string;
  iconOnly?: boolean;
}) {
  const external = isExternal(contact.href);
  return (
    <a
      href={contact.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...trackClick('contact-click', { kind: contact.kind, place: 'hero' })}
      aria-label={iconOnly ? contact.label : undefined}
      title={iconOnly ? contact.label : undefined}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-md border text-sm font-medium transition pointer-coarse:h-11',
        iconOnly ? 'w-9 justify-center pointer-coarse:w-11' : 'px-3.5',
        className,
      )}
    >
      <ContactIcon kind={contact.kind} className="size-4" />
      {!iconOnly && contact.label}
    </a>
  );
}
