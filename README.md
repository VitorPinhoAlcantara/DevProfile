# DevProfile

Portfólio de Vitor Pinho Alcantara: site público no estilo cliente de API, API própria documentada, painel admin e currículo em PDF gerado a partir dos mesmos dados.

## Estrutura

```text
apps/
  api/        NestJS — API pública em /api (e, nas próximas fases, admin e geração do CV)
  web/        Next.js — site público e painel admin
packages/
  shared/     Schemas Zod compartilhados entre api e web
infra/caddy/  Roteador interno: /api/* → api, resto → web
docs/research/  Pesquisas que embasam decisões do projeto
```

## Desenvolvimento

Requisitos: Node 24 e pnpm (via `corepack enable pnpm`).

```bash
pnpm install
docker compose -f compose.dev.yaml up -d   # Postgres local
pnpm dev                                   # api em :3001, web em :3000
```

Outros comandos: `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`.

## Produção (homelab)

```bash
cp .env.example .env   # ajuste a senha do Postgres
docker compose up -d --build
```

O Caddy escuta na porta **7635**, a mesma do site antigo, para onde o túnel Cloudflare Zero Trust já aponta. O HTTPS fica a cargo do Cloudflare; dentro do homelab o tráfego é HTTP simples. Só o Caddy expõe porta no host — api, web e Postgres ficam na rede interna do Docker.
