import { getTranslations } from 'next-intl/server';
import type { PublicContact } from '@devprofile/shared';
import { ContactForm } from '@/components/sections/contact-form';
import { ContactIcon, isExternal } from '@/components/ui/contact-icon';
import { Section } from '@/components/ui/section';
import { sections } from '@/lib/sections';

export async function ContactSection({
  contacts,
}: {
  contacts: PublicContact[];
}) {
  const t = await getTranslations('contact');
  const tNav = await getTranslations('nav');

  return (
    <Section section={sections[5]} title={tNav('contact')}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <p className="leading-relaxed text-muted">{t('intro')}</p>
          <ul className="mt-5 space-y-2">
            {contacts.map((contact) => (
              <li key={contact.href}>
                <a
                  href={contact.href}
                  {...(isExternal(contact.href)
                    ? { target: '_blank', rel: 'noreferrer' }
                    : {})}
                  className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3 transition hover:border-line-strong"
                >
                  <ContactIcon
                    kind={contact.kind}
                    className="size-4 text-accent"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">
                      {contact.label}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {contact.value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}
