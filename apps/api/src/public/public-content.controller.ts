import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';
import {
  apiErrorSchema,
  envelopeSchema,
  localeQuerySchema,
  type LocaleQuery,
  publicCertificationSchema,
  publicContactSchema,
  publicEducationSchema,
  publicExperienceSchema,
  publicLanguageSchema,
  publicPortfolioSchema,
  publicProfileSchema,
  publicProjectSchema,
  publicProjectSummarySchema,
  publicSkillCategorySchema,
  slugSchema,
} from '@devprofile/shared';
import { ApiRoute } from '../common/api-route.decorator.js';
import { ValidParams, ValidQuery } from '../common/validation.js';
import { PublicContentService } from './public-content.service.js';

const invalidLang = {
  description: 'Parâmetros inválidos (por exemplo, `lang` fora das opções)',
  schema: apiErrorSchema,
};
const notFound = {
  description: 'Recurso não encontrado',
  schema: apiErrorSchema,
};
const slugParamsSchema = z.object({ slug: slugSchema });

@Controller('v1')
export class PublicContentController {
  constructor(private readonly content: PublicContentService) {}

  @Get('portfolio')
  @ApiRoute({
    summary: 'Portfólio completo',
    description:
      'Tudo o que a página inicial mostra em uma única chamada: perfil, contatos, skills, experiência, projetos, formação, certificações e idiomas.',
    tags: ['Portfólio'],
    responses: {
      200: {
        description: 'Portfólio no idioma pedido',
        schema: envelopeSchema(publicPortfolioSchema),
      },
      400: invalidLang,
    },
  })
  portfolio(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.portfolio(lang));
  }

  @Get('profile')
  @ApiRoute({
    summary: 'Perfil',
    description: 'Nome, cargo, localização, resumo e disponibilidade.',
    tags: ['Sobre'],
    responses: {
      200: {
        description: 'Perfil',
        schema: envelopeSchema(publicProfileSchema),
      },
      400: invalidLang,
      404: notFound,
    },
  })
  profile(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.profile(lang));
  }

  @Get('contacts')
  @ApiRoute({
    summary: 'Canais de contato',
    tags: ['Sobre'],
    responses: {
      200: {
        description: 'Canais públicos de contato',
        schema: envelopeSchema(z.array(publicContactSchema)),
      },
      400: invalidLang,
    },
  })
  contacts(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.contacts());
  }

  @Get('skills')
  @ApiRoute({
    summary: 'Habilidades técnicas',
    description: 'Tecnologias agrupadas por categoria.',
    tags: ['Sobre'],
    responses: {
      200: {
        description: 'Categorias com suas skills',
        schema: envelopeSchema(z.array(publicSkillCategorySchema)),
      },
      400: invalidLang,
    },
  })
  skills(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.skills(lang));
  }

  @Get('experience')
  @ApiRoute({
    summary: 'Experiência profissional',
    tags: ['Carreira'],
    responses: {
      200: {
        description: 'Experiências, da mais recente para a mais antiga',
        schema: envelopeSchema(z.array(publicExperienceSchema)),
      },
      400: invalidLang,
    },
  })
  experience(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.experience(lang));
  }

  @Get('projects')
  @ApiRoute({
    summary: 'Projetos',
    tags: ['Projetos'],
    responses: {
      200: {
        description: 'Lista resumida dos projetos',
        schema: envelopeSchema(z.array(publicProjectSummarySchema)),
      },
      400: invalidLang,
    },
  })
  projects(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.projects(lang));
  }

  @Get('projects/:slug')
  @ApiRoute({
    summary: 'Detalhes de um projeto',
    tags: ['Projetos'],
    responses: {
      200: {
        description: 'Projeto com a descrição completa',
        schema: envelopeSchema(publicProjectSchema),
      },
      400: invalidLang,
      404: notFound,
    },
  })
  project(
    @ValidParams(slugParamsSchema) { slug }: z.infer<typeof slugParamsSchema>,
    @ValidQuery(localeQuerySchema) { lang }: LocaleQuery,
  ) {
    return this.content.wrap(lang, () => this.content.project(slug, lang));
  }

  @Get('education')
  @ApiRoute({
    summary: 'Formação acadêmica',
    tags: ['Formação'],
    responses: {
      200: {
        description: 'Cursos e graduações',
        schema: envelopeSchema(z.array(publicEducationSchema)),
      },
      400: invalidLang,
    },
  })
  education(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.education(lang));
  }

  @Get('certifications')
  @ApiRoute({
    summary: 'Certificações',
    tags: ['Formação'],
    responses: {
      200: {
        description: 'Certificações e trilhas concluídas',
        schema: envelopeSchema(z.array(publicCertificationSchema)),
      },
      400: invalidLang,
    },
  })
  certifications(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.certifications(lang));
  }

  @Get('languages')
  @ApiRoute({
    summary: 'Idiomas',
    tags: ['Formação'],
    responses: {
      200: {
        description: 'Idiomas e nível',
        schema: envelopeSchema(z.array(publicLanguageSchema)),
      },
      400: invalidLang,
    },
  })
  languages(@ValidQuery(localeQuerySchema) { lang }: LocaleQuery) {
    return this.content.wrap(lang, () => this.content.languages(lang));
  }
}
