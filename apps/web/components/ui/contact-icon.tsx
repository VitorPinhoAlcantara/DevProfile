import { Globe, Mail, MessageCircle, Phone } from 'lucide-react';
import type { PublicContact } from '@devprofile/shared';
import { GithubIcon, LinkedinIcon } from '@/components/ui/brand-icons';

export function ContactIcon({
  kind,
  className,
}: {
  kind: PublicContact['kind'];
  className?: string;
}) {
  switch (kind) {
    case 'EMAIL':
      return <Mail className={className} aria-hidden />;
    case 'PHONE':
      return <Phone className={className} aria-hidden />;
    case 'WHATSAPP':
      return <MessageCircle className={className} aria-hidden />;
    case 'LINKEDIN':
      return <LinkedinIcon className={className} />;
    case 'GITHUB':
      return <GithubIcon className={className} />;
    default:
      return <Globe className={className} aria-hidden />;
  }
}

/** External links open in a new tab; mailto/tel stay in place. */
export const isExternal = (href: string) => /^https?:\/\//.test(href);
