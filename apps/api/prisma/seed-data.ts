import type { PortfolioInput } from '@devprofile/shared';
import { projectPages } from './seed-project-pages.js';

// Initial content, migrated from the old site's data/*.json (DevProfile-API)
// and reconciled with the CV PDF of 2026-10 (graduation forecast: early 2028).
// After the first load the admin panel is the source of truth; edit there, not here.

export const portfolioSeed: PortfolioInput = {
  profile: {
    fullName: 'Vitor Pinho Alcantara',
    headline: {
      pt: 'Desenvolvedor Back-end / Full Stack',
      en: 'Back-end / Full Stack Developer',
    },
    location: {
      pt: 'Aracaju – SE, Brasil',
      en: 'Aracaju, Brazil',
    },
    summary: {
      pt: 'Estudante de Ciência da Computação com foco em desenvolvimento de software, especialmente back-end e integração de APIs. Tenho experiência com Node.js, NestJS, TypeScript, PostgreSQL, Docker, Python e Next.js, em projetos full stack, uso de inteligência artificial e trabalho em equipe. Meu interesse principal está em back-end e bancos de dados, e busco uma oportunidade como desenvolvedor júnior para aplicar e aprimorar minhas habilidades técnicas e comportamentais.',
      en: 'Computer Science student focused on software development, especially back-end work and API integrations. I have experience with Node.js, NestJS, TypeScript, PostgreSQL, Docker, Python, and Next.js across full stack projects, AI-assisted work, and teamwork. My main interests are back-end and databases, and I am looking for a junior developer role to apply and grow my technical and interpersonal skills.',
    },
    cvSummary: {
      pt: 'Desenvolvedor back-end júnior e estudante de Ciência da Computação (UFS), com experiência em Node.js, NestJS, TypeScript, PostgreSQL e Docker. Foco em APIs, bancos de dados e integrações.',
      en: 'Junior back-end developer and Computer Science student (UFS) with hands-on experience in Node.js, NestJS, TypeScript, PostgreSQL, and Docker. Focused on APIs, databases, and integrations.',
    },
    cvObjective: {
      pt: 'Estágio em Desenvolvimento Back-end',
      en: 'Back-end Development Internship',
    },
    availability: 'OPEN_TO_WORK',
    workModes: ['REMOTE', 'HYBRID', 'ONSITE'],
    availabilityNote: {
      pt: 'Disponível para trabalho presencial, remoto ou híbrido, buscando oportunidade como desenvolvedor júnior.',
      en: 'Available for on-site, remote, or hybrid work and seeking a junior developer opportunity.',
    },
    photo: 'media:profile-photo.jpg',
  },

  contacts: [
    {
      kind: 'EMAIL',
      label: 'E-mail',
      value: 'vitoralcantara1722@gmail.com',
      href: 'mailto:vitoralcantara1722@gmail.com',
    },
    {
      kind: 'LINKEDIN',
      label: 'LinkedIn',
      value: 'linkedin.com/in/vitor-alcantara-dev',
      href: 'https://linkedin.com/in/vitor-alcantara-dev',
    },
    {
      kind: 'GITHUB',
      label: 'GitHub',
      value: 'github.com/VitorPinhoAlcantara',
      href: 'https://github.com/VitorPinhoAlcantara',
    },
    {
      // The site itself: pointless on the page, useful on the CV header.
      kind: 'WEBSITE',
      label: 'Portfólio',
      value: 'alcantara.dev.br',
      href: 'https://alcantara.dev.br',
      showOnSite: false,
    },
    {
      // Kept off the public page; it still goes on the CV.
      kind: 'PHONE',
      label: 'Telefone',
      value: '+55 (79) 99136-0886',
      href: 'tel:+5579991360886',
      showOnSite: false,
    },
  ],

  // Grouped the way the CV prints them ("Linguagens: …", "Back-end: …").
  skillCategories: [
    {
      key: 'linguagens',
      name: { pt: 'Linguagens', en: 'Languages' },
      skills: [
        { name: 'TypeScript' },
        { name: 'JavaScript' },
        { name: 'Python' },
        { name: 'SQL' },
        { name: 'Java' },
        { name: 'HTML' },
        { name: 'CSS' },
      ],
    },
    {
      key: 'back-end',
      name: { pt: 'Back-end', en: 'Back-end' },
      skills: [
        { name: 'Node.js' },
        { name: 'NestJS' },
        { name: 'REST APIs' },
        { name: 'Prisma' },
        { name: 'JWT' },
        // Seen in project repositories; kept off the CV until confirmed.
        { name: 'FastAPI', showOnCv: false },
        { name: 'Fastify', showOnCv: false },
        { name: 'Pandas', showOnCv: false },
      ],
    },
    {
      key: 'bancos-de-dados',
      name: { pt: 'Bancos de dados', en: 'Databases' },
      skills: [{ name: 'PostgreSQL' }],
    },
    {
      key: 'front-end',
      name: { pt: 'Front-end', en: 'Front-end' },
      skills: [
        { name: 'Next.js' },
        { name: 'React' },
        { name: 'Vue.js' },
        { name: 'Nuxt' },
        { name: 'Vite' },
      ],
    },
    {
      key: 'cloud-e-devops',
      name: { pt: 'Cloud e DevOps', en: 'Cloud and DevOps' },
      skills: [
        { name: 'Docker' },
        { name: 'AWS' },
        { name: 'Git' },
        { name: 'GitHub' },
      ],
    },
    {
      key: 'metodos-e-ferramentas',
      name: { pt: 'Métodos e ferramentas', en: 'Methods and tools' },
      skills: [
        { name: 'Scrum' },
        { name: 'UML' },
        { name: 'Modelagem de requisitos', nameEn: 'Requirements modeling' },
        { name: 'Power BI', showOnCv: false },
        { name: 'Excel', showOnCv: false },
      ],
    },
    {
      key: 'comportamentais',
      name: { pt: 'Competências comportamentais', en: 'Soft skills' },
      skills: [
        { name: 'Aprendizado contínuo', nameEn: 'Continuous learning' },
        { name: 'Trabalho em equipe', nameEn: 'Teamwork' },
        { name: 'Comunicação', nameEn: 'Communication' },
        { name: 'Resolução de problemas', nameEn: 'Problem solving' },
        { name: 'Pensamento crítico', nameEn: 'Critical thinking' },
        { name: 'Gestão do tempo', nameEn: 'Time management' },
        { name: 'Proatividade', nameEn: 'Proactivity' },
        { name: 'Mentalidade antifrágil', nameEn: 'Antifragile mindset' },
      ],
    },
  ],

  experiences: [
    {
      company: 'RCDNC',
      role: {
        pt: 'Estagiário de Desenvolvimento',
        en: 'Software Developer Intern',
      },
      employmentType: 'INTERNSHIP',
      period: { start: '2025-09', end: '2026-06' },
      summary: {
        pt: 'Desenvolvimento full stack no projeto Postai com Node.js, Next.js, JavaScript, HTML e CSS, além da manipulação de banco de dados com Prisma e PostgreSQL. Também criei e ajustei prompts de inteligência artificial para aumentar a produtividade do time, colaborando pelo GitHub, Slack e Gather.',
        en: 'Full stack development on the Postai project using Node.js, Next.js, JavaScript, HTML, and CSS, plus database work with Prisma and PostgreSQL. I also wrote and tuned AI prompts to boost team productivity, collaborating through GitHub, Slack, and Gather.',
      },
      cvBullets: {
        pt: [
          'Desenvolvi funcionalidades full stack do produto Postai com Node.js, Next.js e JavaScript.',
          'Modelei e mantive o banco de dados PostgreSQL com Prisma, incluindo migrations e consultas.',
          'Criei e ajustei prompts de IA para automatizar tarefas e aumentar a produtividade do time.',
        ],
        en: [
          'Built full stack features for the Postai product with Node.js, Next.js, and JavaScript.',
          'Modeled and maintained the PostgreSQL database with Prisma, including migrations and queries.',
          'Wrote and tuned AI prompts to automate tasks and boost team productivity.',
        ],
      },
      skills: [
        'Node.js',
        'Next.js',
        'JavaScript',
        'HTML',
        'CSS',
        'Prisma',
        'PostgreSQL',
        'GitHub',
        'Trabalho em equipe',
      ],
    },
    {
      // On the CV under "Projetos Relevantes"; it is volunteer work, so it lives here.
      company: 'Innovation Hub – UFS',
      role: {
        pt: 'Desenvolvedor Back-end',
        en: 'Back-end Developer',
      },
      employmentType: 'VOLUNTEER',
      location: 'Universidade Federal de Sergipe',
      period: { start: '2025-03', end: '2026-09' },
      summary: {
        pt: 'Trabalho voluntário como desenvolvedor back-end no Innovation Hub da Universidade Federal de Sergipe, desenvolvendo e documentando sistemas em equipe com Node.js, NestJS, TypeScript, PostgreSQL e Docker.',
        en: 'Volunteer back-end developer at the Federal University of Sergipe Innovation Hub, building and documenting systems as a team with Node.js, NestJS, TypeScript, PostgreSQL, and Docker.',
      },
      cvBullets: {
        pt: [
          'Desenvolvi e documentei, em equipe, serviços back-end com Node.js, NestJS, TypeScript, PostgreSQL e Docker.',
        ],
        en: [
          'Built and documented back-end services as a team with Node.js, NestJS, TypeScript, PostgreSQL, and Docker.',
        ],
      },
      skills: [
        'Node.js',
        'NestJS',
        'TypeScript',
        'PostgreSQL',
        'Docker',
        'Trabalho em equipe',
      ],
    },
    {
      company: 'Lojão Fasouto',
      role: { pt: 'Estagiário de TI', en: 'IT Intern' },
      employmentType: 'INTERNSHIP',
      period: { start: '2023-09', end: '2024-10' },
      summary: {
        pt: 'Atendimento ao usuário, suporte técnico, manutenção e instalação de software e hardware, além de coleta e análise de dados para melhoria de processos.',
        en: 'User support, technical support, software and hardware maintenance and installation, plus data collection and analysis to improve processes.',
      },
      cvBullets: {
        pt: [
          'Prestei suporte técnico aos usuários, com instalação e manutenção de software e hardware.',
          'Coletei e analisei dados operacionais para apoiar a melhoria de processos internos.',
        ],
        en: [
          'Provided technical support to users, installing and maintaining software and hardware.',
          'Collected and analyzed operational data to support internal process improvements.',
        ],
      },
      skills: ['Excel', 'Power BI', 'Comunicação', 'Resolução de problemas'],
    },
  ],

  projects: [
    {
      slug: 'grafeno',
      name: 'Grafeno',
      featured: true,
      cover: 'media:grafeno-home.jpg',
      body: projectPages.grafeno!,
      period: { start: '2025-10', end: '2025-10' },
      tagline: {
        pt: 'Aplicação web para organizar e explorar artigos científicos de astrobiologia.',
        en: 'Web application to organize and explore scientific papers in astrobiology.',
      },
      summary: {
        pt: 'Projeto desenvolvido em equipe no hackathon NASA Space Apps Challenge 2025 para organizar e explorar artigos científicos de astrobiologia. Fui responsável pelo processamento de embeddings e pelo cálculo de similaridade semântica, que permitem descobrir artigos relacionados.',
        en: 'Team project built at the NASA Space Apps Challenge 2025 hackathon to organize and explore scientific papers in astrobiology. I was responsible for embeddings processing and semantic similarity, which make related papers easy to discover.',
      },
      cvBullets: {
        pt: [
          'Desenvolvi, no NASA Space Apps Challenge 2025, uma aplicação que recomenda artigos científicos relacionados por similaridade semântica de embeddings.',
        ],
        en: [
          'Built, at the NASA Space Apps Challenge 2025, an app that recommends related scientific papers through embedding-based semantic similarity.',
        ],
      },
      links: [
        {
          kind: 'WEBSITE',
          label: 'Site',
          href: 'https://grafenoih.alcantara.dev.br/',
        },
        {
          kind: 'REPOSITORY',
          label: 'Front-end',
          href: 'https://github.com/GrafenoIH/grafenoih-front',
        },
        {
          kind: 'REPOSITORY',
          label: 'Back-end',
          href: 'https://github.com/GrafenoIH/grafenoih-back',
        },
      ],
      skills: ['Python', 'FastAPI', 'Pandas', 'Vue.js', 'Vite', 'Docker'],
    },
    {
      slug: 'streeturban',
      name: 'StreetUrban',
      featured: true,
      cover: 'media:streeturban-home.jpg',
      body: projectPages.streeturban!,
      tagline: {
        pt: 'Catálogo online de loja de roupas com painel administrativo para gestão de produtos.',
        en: 'Online clothing store catalog with an admin panel for product management.',
      },
      summary: {
        pt: 'Plataforma de catálogo para loja de roupas, com front-end em React, TypeScript e Vite e back-end em NestJS com Prisma e PostgreSQL. Conta com autenticação JWT e um painel administrativo para gerenciar produtos, categorias e imagens armazenadas em object storage.',
        en: 'Catalog platform for a clothing store with a React, TypeScript, and Vite front-end and a NestJS back-end using Prisma and PostgreSQL. Includes JWT authentication and an admin panel for managing products, categories, and images stored in object storage.',
      },
      cvBullets: {
        pt: [
          'Construí a API em NestJS com Prisma e PostgreSQL, com autenticação JWT e upload de imagens para object storage.',
          'Desenvolvi o painel administrativo em React e TypeScript para gestão de produtos e categorias, hoje em produção.',
        ],
        en: [
          'Built the NestJS API with Prisma and PostgreSQL, including JWT authentication and image uploads to object storage.',
          'Developed the React and TypeScript admin panel for product and category management, now in production.',
        ],
      },
      links: [
        { kind: 'WEBSITE', label: 'Site', href: 'https://streeturban.com.br' },
        {
          kind: 'REPOSITORY',
          label: 'GitHub',
          href: 'https://github.com/VitorPinhoAlcantara/StreetUrban',
        },
      ],
      skills: [
        'NestJS',
        'Prisma',
        'PostgreSQL',
        'JWT',
        'React',
        'TypeScript',
        'Vite',
        'Docker',
      ],
    },
    {
      slug: 'snapops',
      name: 'SnapOps',
      featured: false,
      body: projectPages.snapops!,
      tagline: {
        pt: 'Plataforma web para organizar operações de conteúdo e publicações em redes sociais.',
        en: 'Web platform for organizing content operations and social media publishing.',
      },
      summary: {
        pt: 'Projeto concebido como uma plataforma multi-tenant para organizar operações de conteúdo, automação de publicações e integrações com serviços externos. Hoje funciona como portfólio técnico, registrando arquitetura, decisões e aprendizados do desenvolvimento.',
        en: 'Project conceived as a multi-tenant platform for organizing content operations, publishing automation, and integrations with external services. It now serves as a technical portfolio piece documenting the architecture, decisions, and lessons learned.',
      },
      cvBullets: {
        pt: [
          'Projetei a arquitetura multi-tenant de uma plataforma de automação de publicações com integrações a serviços externos.',
        ],
        en: [
          'Designed the multi-tenant architecture of a publishing automation platform with external service integrations.',
        ],
      },
      links: [
        {
          kind: 'REPOSITORY',
          label: 'GitHub',
          href: 'https://github.com/Tea-Collab/SnapOps',
        },
      ],
      skills: [
        'TypeScript',
        'Fastify',
        'Prisma',
        'Nuxt',
        'Vue.js',
        'PostgreSQL',
        'Docker',
      ],
    },
    {
      slug: 'centralnovel-downloader',
      name: 'CentralNovel Downloader',
      showOnCv: false,
      body: projectPages['centralnovel-downloader']!,
      tagline: {
        pt: 'Ferramenta em Python para baixar novels, converter para CBZ e gerar audiolivros.',
        en: 'Python tool to download novels, convert them to CBZ, and generate audiobooks.',
      },
      summary: {
        pt: 'Ferramenta em Python com fluxo interativo no terminal para buscar novels no CentralNovel, selecionar capítulos ou volumes específicos e gerar arquivos organizados para leitura offline.',
        en: 'Python tool with an interactive terminal flow to fetch novels from CentralNovel, pick specific chapters or volumes, and generate organized files for offline reading.',
      },
      cvBullets: {
        pt: [
          'Criei uma ferramenta de linha de comando em Python que baixa capítulos e converte PDF para CBZ para leitura offline.',
        ],
        en: [
          'Created a Python command-line tool that downloads chapters and converts PDFs to CBZ for offline reading.',
        ],
      },
      links: [
        {
          kind: 'REPOSITORY',
          label: 'GitHub',
          href: 'https://github.com/VitorPinhoAlcantara/centralnovel-downloader',
        },
      ],
      skills: ['Python'],
    },
    {
      slug: 'training-dummy',
      name: 'Minecraft Mod: Training Dummy',
      showOnCv: false,
      body: projectPages['training-dummy']!,
      tagline: {
        pt: 'Mod para Minecraft que adiciona um boneco de treino para testar dano e combate.',
        en: 'Minecraft mod that adds a training dummy for testing damage and combat.',
      },
      summary: {
        pt: 'Mod desenvolvido em Java e publicado no CurseForge, que adiciona uma entidade de treino usada para medir dano, testar builds de combate e ajustar mecânicas do jogo.',
        en: 'Java mod published on CurseForge that adds a training dummy entity used to measure damage, test combat builds, and tune gameplay mechanics.',
      },
      cvBullets: {
        pt: [
          'Desenvolvi e publiquei no CurseForge um mod em Java que mede dano de combate por meio de uma entidade de treino.',
        ],
        en: [
          'Developed and published on CurseForge a Java mod that measures combat damage through a training dummy entity.',
        ],
      },
      links: [
        {
          kind: 'STORE',
          label: 'CurseForge',
          href: 'https://www.curseforge.com/minecraft/mc-mods/training-dummy',
        },
        {
          kind: 'REPOSITORY',
          label: 'GitHub',
          href: 'https://github.com/VitorPinhoAlcantara/training-dummy',
        },
      ],
      skills: ['Java'],
    },
  ],

  education: [
    {
      institution: 'Universidade Federal de Sergipe',
      institutionShort: 'UFS',
      degree: {
        pt: 'Bacharelado em Ciência da Computação',
        en: 'B.Sc. in Computer Science',
      },
      // CV: "Julho 2021 – Início de 2028 (Previsão)".
      period: { start: '2021-07', end: '2028-03' },
      endIsExpected: true,
      summary: {
        pt: 'Formação acadêmica voltada a fundamentos de computação, desenvolvimento de software e resolução de problemas.',
        en: 'Academic track focused on computer science fundamentals, software development, and problem solving.',
      },
    },
  ],

  certifications: [
    {
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services (AWS)',
      issuedAt: '2025-02',
      expiresAt: '2028-02',
      note: {
        pt: 'Preparação pela Escola da Nuvem.',
        en: 'Prepared through Escola da Nuvem.',
      },
    },
    {
      name: 'AWS re/Start',
      issuer: 'Escola da Nuvem',
      issuedAt: '2025',
      note: {
        pt: 'Trilha de formação com foco em fundamentos de cloud e empregabilidade.',
        en: 'Training track focused on cloud fundamentals and job readiness.',
      },
    },
  ],

  languages: [
    { name: { pt: 'Português', en: 'Portuguese' }, level: 'NATIVE' },
    { name: { pt: 'Inglês', en: 'English' }, level: 'INTERMEDIATE' },
  ],

  settings: {
    cvProfile: 'JUNIOR',
  },
};
