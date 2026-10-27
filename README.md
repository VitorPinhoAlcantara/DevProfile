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
docker compose -f compose.dev.yaml up -d   # Postgres local em 127.0.0.1:5433
cp apps/api/.env.example apps/api/.env
pnpm --filter @devprofile/api db:migrate   # aplica as migrations
pnpm --filter @devprofile/api db:seed      # carrega o conteúdo inicial (só se o banco estiver vazio)
pnpm dev                                   # api em :3001, web em :3000
```

Outros comandos: `pnpm build`, `pnpm test`, `pnpm test:e2e` (sobe um Postgres descartável via Testcontainers), `pnpm typecheck`, `pnpm lint`, `pnpm format`.

Com `pnpm dev`, o site fica em http://localhost:3000 (inglês em `/en`) e a documentação interativa da API em http://localhost:3000/api/docs (o Next repassa `/api/*` para a api só em desenvolvimento; em produção quem faz isso é o Caddy).

O conteúdo inicial está em `apps/api/prisma/seed-data.ts`, validado pelos schemas de `packages/shared`. Depois da primeira carga, o painel admin passa a ser a fonte da verdade; `SEED_FORCE=1` sobrescreve o banco com o seed.

## Produção (homelab)

```bash
cp .env.example .env   # ajuste a senha do Postgres
docker compose up -d --build
```

O serviço `migrate` roda antes da api a cada deploy: aplica as migrations e, com o banco vazio, carrega o seed.

### Painel admin

O painel fica em `/admin`. Não existe cadastro público: o usuário é criado (ou tem a senha redefinida) pelo terminal, o que também encerra as sessões abertas:

```bash
docker compose run --rm -it migrate tsx scripts/create-admin.ts
```

Em desenvolvimento: `pnpm --filter @devprofile/api admin:create`. Depois do primeiro login, ative o 2FA em **Conta**.

O `.env` precisa de `APP_SECRET` (criptografa os segredos do 2FA; não troque depois) e `REVALIDATE_TOKEN` (a api avisa o site para atualizar após salvar). Gere cada um com `openssl rand -base64 48`. Faça backup do volume `uploads` junto com o banco.

O Caddy escuta na porta **7635**, a mesma do site antigo, para onde o túnel Cloudflare Zero Trust já aponta. O HTTPS fica a cargo do Cloudflare; dentro do homelab o tráfego é HTTP simples. Só o Caddy expõe porta no host — api, web e Postgres ficam na rede interna do Docker.

### Backup

Todo dia às 03:30, `~/Code/production/homelab-backup` roda `scripts/backup-dump.sh`. O backup inclui o banco, as imagens enviadas (volume `uploads`) e o `.env`. A cópia local fica em `~/backups/DevProfile` e uma cópia criptografada vai para o Google Drive, em `projects/DevProfile/backups`. O passo a passo de restauração está no README do `homelab-backup`.

### Métricas de visita (Umami)

O Umami é um projeto separado, em `~/Code/production/umami`, compartilhado com os outros sites do homelab. O painel fica em `http://<host>:20000`, só na rede local. Publicamente, o Caddy do portfólio expõe só o script (`/m/p.js` → `/script.js`) e o envio dos dados (`/m/e` → `/api/send`), repassados ao Umami pela máquina (`UMAMI_UPSTREAM`, padrão `host.docker.internal:20000`). Se o Umami estiver fora do ar, só a contagem para; o site continua no ar.

O script só é carregado quando `UMAMI_WEBSITE_ID` está no `.env`.

Eventos registrados:

- `cv-download` (`lang`, `place`);
- `contact-click` (`kind`, `place`);
- `project-link` (`project`, `kind`);
- `contact-form-sent`.
