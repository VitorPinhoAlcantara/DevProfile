// README-style pages for the projects, written from each repository's README and
// screenshots of the live sites. The cover image is shown above the page, so it
// isn't repeated in the Markdown. `media:<file>` points at prisma/seed-media/<file>.
// After the first load these are edited in the admin panel.

export const projectPages: Record<string, { pt: string; en: string }> = {
  grafeno: {
    pt: `
O **Grafeno** nasceu no **NASA Space Apps Challenge 2025**, um hackathon global da NASA. O desafio era facilitar a exploração de publicações científicas sobre biologia espacial e astrobiologia, uma base grande e difícil de navegar só com busca por palavra-chave.

## Como funciona

- Cada artigo vira um ponto no grafo, ligado aos artigos mais parecidos com ele.
- A busca encontra artigos por tema e lista os resultados com link direto para a publicação original.
- A semelhança entre artigos vem de **embeddings** (representações numéricas do texto) e de **similaridade semântica**, e não apenas de palavras em comum.

![Busca por "mars" listando artigos relacionados](media:grafeno-search.jpg)

## Minha parte

Fiquei responsável pelo **processamento dos embeddings** e pelo **cálculo de similaridade semântica**, o núcleo que decide quais artigos se conectam.

## Arquitetura

| Camada | Tecnologias |
| --- | --- |
| Back-end | Python, FastAPI, Pandas e Pydantic, com documentação automática da API |
| Front-end | Vue 3 e Vite, com a visualização em grafo |
| Infra | Docker |

![Grafeno no celular](media:grafeno-mobile.jpg)
`.trim(),
    en: `
**Grafeno** was born at the **NASA Space Apps Challenge 2025**, NASA's global hackathon. The challenge was to make space biology and astrobiology publications easier to explore, a large collection that is hard to browse with keyword search alone.

## How it works

- Each paper is a node in the graph, linked to the papers most similar to it.
- Search finds papers by topic and lists the results with a direct link to the original publication.
- Similarity comes from **embeddings** (numeric representations of the text) and **semantic similarity**, not just shared words.

![Searching for "mars" lists related papers](media:grafeno-search.jpg)

## My part

I was responsible for **embeddings processing** and **semantic similarity**, the core that decides which papers connect.

## Architecture

| Layer | Technologies |
| --- | --- |
| Back-end | Python, FastAPI, Pandas, and Pydantic, with auto-generated API docs |
| Front-end | Vue 3 and Vite, with the graph visualization |
| Infra | Docker |

![Grafeno on a phone](media:grafeno-mobile.jpg)
`.trim(),
  },

  streeturban: {
    pt: `
O **StreetUrban** é o catálogo online de uma loja de roupas streetwear, **em produção** em [streeturban.com.br](https://streeturban.com.br). O cliente navega pelas novidades, destaques e pelo catálogo completo, escolhe tamanho e cor e finaliza o pedido pelo WhatsApp.

## Para o cliente

- Vitrine com novidades e destaques
- Catálogo com filtros por categoria e tamanho, além de busca
- Página de produto com tamanhos, cores, estoque disponível e pedido pelo WhatsApp

![Página de produto com tamanho, cor e estoque](media:streeturban-product.jpg)

## Para a loja

Um **painel administrativo** protegido por login (**JWT**) para cadastrar e editar produtos e categorias. As imagens dos produtos ficam em um **object storage**.

## Arquitetura

| Camada | Tecnologias |
| --- | --- |
| Back-end | NestJS, Prisma e PostgreSQL |
| Front-end | React, TypeScript e Vite |
| Autenticação | JWT |
| Arquivos | Object storage para as imagens |
| Infra | Docker |

![StreetUrban no celular](media:streeturban-mobile.jpg)
`.trim(),
    en: `
**StreetUrban** is the online catalog of a streetwear clothing store, **live** at [streeturban.com.br](https://streeturban.com.br). Customers browse new arrivals, highlights, and the full catalog, pick a size and color, and place the order through WhatsApp.

## For customers

- Storefront with new arrivals and highlights
- Catalog with category and size filters, plus search
- Product page with sizes, colors, available stock, and ordering via WhatsApp

![Product page with size, color, and stock](media:streeturban-product.jpg)

## For the store

A login-protected **admin panel** (**JWT**) to create and edit products and categories. Product images are kept in **object storage**.

## Architecture

| Layer | Technologies |
| --- | --- |
| Back-end | NestJS, Prisma, and PostgreSQL |
| Front-end | React, TypeScript, and Vite |
| Auth | JWT |
| Files | Object storage for images |
| Infra | Docker |

![StreetUrban on a phone](media:streeturban-mobile.jpg)
`.trim(),
  },

  snapops: {
    pt: `
O **SnapOps** foi concebido como uma plataforma **multi-tenant** para organizar operações de conteúdo: agências e marcas gerenciando contas sociais, agendando e publicando posts e cobrando pelo serviço. Desenvolvi o projeto em dupla com [Brunoglvm](https://github.com/brunoglvm).

> O projeto está **pausado** e o repositório segue público como portfólio técnico: ele registra a arquitetura, as decisões e os aprendizados, não um produto pronto para produção.

## O que foi construído

- Front-end e back-end desacoplados
- Modelagem de autenticação, organizações, membros, marcas e contas sociais
- Integrações com **Instagram** (publicação), **Stripe** (cobrança) e **Cloudflare R2** (mídia)
- Fluxos de cobrança, agendamento e publicação de conteúdo

## Arquitetura

| Camada | Tecnologias |
| --- | --- |
| Back-end | TypeScript, Fastify e Prisma |
| Front-end | Nuxt 4 e Vue 3 |
| Banco | PostgreSQL via Docker Compose |

## Aprendizados

- Nem todo projeto tecnicamente promissor avança no ritmo das exigências burocráticas e operacionais (aprovação de apps, cobrança, contas de serviço).
- Decisões de arquitetura, billing e integrações externas têm um custo de continuidade que pesa diretamente no roadmap.
- Documentar bem um projeto, mesmo pausado, preserva o valor do que foi construído.
`.trim(),
    en: `
**SnapOps** was conceived as a **multi-tenant** platform for content operations: agencies and brands managing social accounts, scheduling and publishing posts, and billing for the service. I built it with [Brunoglvm](https://github.com/brunoglvm).

> The project is **paused**, and the repository stays public as a technical portfolio piece: it documents the architecture, decisions, and lessons learned rather than a production-ready product.

## What was built

- Decoupled front-end and back-end
- Modeling for authentication, organizations, members, brands, and social accounts
- Integrations with **Instagram** (publishing), **Stripe** (billing), and **Cloudflare R2** (media)
- Billing, scheduling, and content publishing flows

## Architecture

| Layer | Technologies |
| --- | --- |
| Back-end | TypeScript, Fastify, and Prisma |
| Front-end | Nuxt 4 and Vue 3 |
| Database | PostgreSQL via Docker Compose |

## Lessons learned

- Not every technically promising project moves at the pace of bureaucratic and operational requirements (app reviews, billing, service accounts).
- Architecture, billing, and third-party integration choices carry ongoing costs that directly shape the roadmap.
- Documenting a project well, even a paused one, preserves the value of what was built.
`.trim(),
  },

  'centralnovel-downloader': {
    pt: `
Ferramenta em **Python** para ler novels do site CentralNovel offline, com uma interface interativa no terminal (navegação por setas, espaço e enter).

## Recursos

- **Download** de capítulos específicos ou volumes inteiros (aceita listas como \`1,2,10-15\`), em PDF ou PDF + CBZ
- **Retomada inteligente:** antes de baixar, verifica o que já existe e pergunta se deve baixar só o que falta ou reescrever
- **Falhas tratadas:** os capítulos com erro são listados no fim, podem ser tentados de novo e ficam registrados em log
- **Limpeza do PDF:** remove automaticamente o link do site e a marca de tradução da primeira página
- **Conversão PDF → CBZ** para leitores de quadrinhos e e-readers

## Audiolivros

Um fluxo completo gera **audiolivros** a partir dos capítulos:

1. lê o texto direto do HTML do site;
2. monta um EPUB por capítulo, com título, autor e série nos metadados;
3. converte em lote para áudio com o **ebook2audiobook** (modelo de voz XTTS);
4. grava as tags e envia os arquivos por **SSH** ao servidor do **Audiobookshelf**, já organizados por autor, série e volume;
5. pede uma nova leitura da biblioteca, e capítulos já existentes são pulados, então dá para interromper e retomar.
`.trim(),
    en: `
A **Python** tool to read novels from the CentralNovel site offline, with an interactive terminal interface (arrow keys, space, and enter).

## Features

- **Downloads** specific chapters or whole volumes (accepts lists like \`1,2,10-15\`), as PDF or PDF + CBZ
- **Smart resume:** checks what already exists and asks whether to fetch only missing chapters or overwrite
- **Failure handling:** failed chapters are listed at the end, can be retried, and are logged
- **PDF cleanup:** automatically removes the site link and translation watermark from the first page
- **PDF → CBZ conversion** for comic and e-book readers

## Audiobooks

A full pipeline turns chapters into **audiobooks**:

1. reads the text straight from the site's HTML;
2. builds one EPUB per chapter with title, author, and series metadata;
3. batch-converts them to audio with **ebook2audiobook** (XTTS voice model);
4. writes the tags and uploads the files over **SSH** to an **Audiobookshelf** server, organized by author, series, and volume;
5. triggers a library scan; existing chapters are skipped, so a run can be stopped and resumed.
`.trim(),
  },

  'training-dummy': {
    pt: `
Mod para **Minecraft**, escrito em **Java** e publicado no [CurseForge](https://www.curseforge.com/minecraft/mc-mods/training-dummy): um boneco de treino estacionário para testar armas, equipamentos e builds de combate.

## Recursos

- **Leitura de dano:** cada golpe mostra o dano causado, na tela ou no chat, como total acumulado, DPS ou por golpe
- **Equipamento completo:** o boneco usa armadura, escudo, armas e, com o Curios API, acessórios
- **Skins reais:** renomeado com uma Name Tag, o boneco busca e veste a skin real daquela conta
- **Isca para mobs:** um item que faz criaturas próximas atacarem o boneco, útil para testar IA de mobs
- **Placar de recordes:** uma variante registra o maior golpe e mantém um ranking local e, opcionalmente, um ranking global entre servidores

## Privacidade e desempenho

O ranking global vem **desligado por padrão**. Desligado, o mod não faz nenhuma requisição de rede. Ligado, envia apenas o apelido e o dano de golpes recordistas, com requisições **assíncronas** que nunca travam o tick do servidor.
`.trim(),
    en: `
A **Minecraft** mod written in **Java** and published on [CurseForge](https://www.curseforge.com/minecraft/mc-mods/training-dummy): a stationary training dummy for testing weapons, gear, and combat builds.

## Features

- **Damage readout:** every hit shows the damage dealt, on screen or in chat, as a running total, DPS, or per hit
- **Full gear:** the dummy wears armor, shields, weapons, and, with Curios API, accessories
- **Real skins:** renamed with a Name Tag, the dummy fetches and wears that account's actual skin
- **Mob lure:** an item that makes nearby mobs attack the dummy, handy for testing mob AI
- **Record scoreboard:** a variant tracks the biggest hit, with a local leaderboard and an optional global one shared across servers

## Privacy and performance

The global leaderboard is **off by default**. When off, the mod makes no network requests at all. When on, it sends only the nickname and damage of record-breaking hits, using **asynchronous** requests that never block the server tick.
`.trim(),
  },
};
