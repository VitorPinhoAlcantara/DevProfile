import type {
  contactKinds,
  cvProfiles,
  employmentTypes,
  languageLevels,
  PortfolioSection,
  projectLinkKinds,
  workModes,
} from '@devprofile/shared';

export const sectionLabels: Record<PortfolioSection, string> = {
  profile: 'Perfil',
  contacts: 'Contatos',
  skillCategories: 'Habilidades',
  experiences: 'Experiências',
  projects: 'Projetos',
  education: 'Formação',
  certifications: 'Certificações',
  languages: 'Idiomas',
  settings: 'Currículo',
};

export const employmentTypeLabels: Record<
  (typeof employmentTypes)[number],
  string
> = {
  INTERNSHIP: 'Estágio',
  FULL_TIME: 'Tempo integral',
  PART_TIME: 'Meio período',
  FREELANCE: 'Freelance',
  VOLUNTEER: 'Trabalho voluntário',
};

export const workModeLabels: Record<(typeof workModes)[number], string> = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ONSITE: 'Presencial',
};

export const contactKindLabels: Record<(typeof contactKinds)[number], string> =
  {
    EMAIL: 'E-mail',
    PHONE: 'Telefone',
    WHATSAPP: 'WhatsApp',
    LINKEDIN: 'LinkedIn',
    GITHUB: 'GitHub',
    WEBSITE: 'Site',
    OTHER: 'Outro',
  };

export const linkKindLabels: Record<(typeof projectLinkKinds)[number], string> =
  {
    REPOSITORY: 'Repositório',
    WEBSITE: 'Site',
    DEMO: 'Demonstração',
    STORE: 'Loja / página',
    DOCS: 'Documentação',
  };

export const languageLevelLabels: Record<
  (typeof languageLevels)[number],
  string
> = {
  BASIC: 'Básico',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
  FLUENT: 'Fluente',
  NATIVE: 'Nativo',
};

export const cvProfileLabels: Record<(typeof cvProfiles)[number], string> = {
  JUNIOR: 'Júnior — Resumo e Habilidades primeiro',
  INTERNSHIP: 'Estágio — Objetivo e Formação primeiro',
};
