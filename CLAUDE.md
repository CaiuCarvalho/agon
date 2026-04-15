# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agon is a Brazilian e-commerce platform (sports apparel) built as a Turborepo monorepo with npm workspaces. The main application lives in `apps/web/` (Next.js 15 with App Router). `apps/api/` is a stub Fastify API (kept because nginx proxies `/api` → `localhost:3333`; do not delete without confirming the deploy pipeline). There are no shared `packages/` — they were removed as unused.

## Commands

All commands should be run from the repo root unless otherwise noted.

**Development:**
```bash
npm run dev          # Start all apps (turbo)
cd apps/web && npm run dev   # Start web app only
```

**Build:**
```bash
npm run build        # Build all apps (turbo)
cd apps/web && npm run build # Runs check:env first, then next build
```

**Testing (in apps/web):**
```bash
npm test             # Run all tests once (vitest --run)
npm run test:watch   # Watch mode
npm run test:ui      # Vitest UI
# Run a single test file:
cd apps/web && npx vitest run src/modules/cart/cart.test.ts
```

**Env check:**
```bash
cd apps/web && npm run check:env  # Validate environment variables
```

## Architecture

### Module Structure

Business logic is organized by domain in `apps/web/src/modules/`:
- `address/` — Address management
- `admin/` — Admin dashboard and product/order management
- `cart/` — Shopping cart (Supabase Realtime sync)
- `checkout/` — Checkout flow and order creation
- `payment/` — Mercado Pago integration (card, PIX, boleto)
- `products/` — Product catalog, search, categories
- `wishlist/` — Wishlist (50-item limit enforced by DB trigger)

### Backend for Frontend (BFF)

Next.js API routes (`apps/web/src/app/api/`) act as the BFF layer. They:
- Call Supabase with the service role key (never exposed to the client)
- Call external APIs (Mercado Pago, Resend, Cloudinary)
- Validate webhooks (Mercado Pago uses `MERCADOPAGO_WEBHOOK_SECRET`)

The Supabase client is initialized per-request. There are two clients:
- **Anon client** — used in Server Components and client-side code
- **Service role client** — used only in API routes for privileged operations

### Authentication & Middleware

`apps/web/src/middleware.ts` protects routes using Supabase session checks with a 5-second timeout. Protected paths: `/admin`, `/perfil`, `/checkout`, `/pedido`. The middleware is lean — `console.log` request tracking was removed; only `console.error` remains for failures.

Admin role is validated by checking both `profiles.role` and `user_metadata.role` in Supabase.

### Data Fetching

- **Server Components**: Supabase client called directly
- **Client Components**: TanStack React Query (v5) with 5-minute staleTime; hooks live in `src/modules/*/hooks/`
- **Forms**: React Hook Form + Zod validation

### Database

Supabase (PostgreSQL) with RLS enabled on all tables. No ORM — Supabase JS client is used directly. Complex atomic operations use Supabase RPC functions (e.g., `create_order_with_payment_atomic`). Migrations are in `supabase/migrations/`.

### Environment Variables

Validated at build and runtime using Zod schemas in `apps/web/src/lib/env.ts`. The build will fail if required variables are missing.

- `NEXT_PUBLIC_*` — safe for client exposure (Supabase anon key, Cloudinary, app URL)
- Server-only — `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `RESEND_API_KEY`

Copy `.env.example` to `.env.local` to get started.

### Timeout Strategy

- Middleware session check: 5s
- Mercado Pago SDK calls: 25s (Next.js default is 60s, leaving headroom)
- React Query: 10s via `meta.timeout`

## Spec-Driven Development (SDD)

Todo trabalho não-trivial (feature nova, bugfix complexo, refatoração) segue este fluxo usando as skills do Claude Code:

1. **`superpowers:brainstorming`** — entender requisitos, propor abordagens, aprovar design
2. **`superpowers:writing-plans`** — plano de implementação passo a passo
3. **`superpowers:subagent-driven-development`** ou **`superpowers:executing-plans`** — execução com checkpoints de revisão
4. **`superpowers:test-driven-development`** — testes antes da implementação
5. **`superpowers:verification-before-completion`** — verificar antes de declarar pronto

### Regras de qualidade (verificadas pelo audit no CI)

- Todo módulo em `apps/web/src/modules/` precisa de `contracts.ts` com `z.object` (Zod)
- Services em `services/` precisam usar `.parse()` ou `.safeParse()` para dados externos
- Secrets hardcoded bloqueiam o CI imediatamente (CRITICAL)
- Anti-patterns `any` são informativos — evitar em código novo, não bloqueiam CI

## Key Integrations

- **Supabase** — auth, database (PostgreSQL + RLS), realtime subscriptions
- **Mercado Pago** — payment processing; webhook at `/api/webhooks/mercadopago`
- **Cloudinary** — image hosting and upload presets
- **Resend** — transactional email (referenced in env schema; confirm active usage before removing)
- **Google Tag Manager** — GTM snippet hardcoded in `apps/web/src/app/layout.tsx` (ID: `GTM-MCVPTPL3`); analytics.ts and GoogleAnalytics component were removed — tracking now goes through GTM only

## Production Infrastructure (VPS)

### Server
- **Host:** `187.127.13.56` — `srv1554002`
- **OS user:** `root`
- **Node:** v20.20.2 / npm 10.8.2
- **Disk:** 96G total, ~8G used

### App location
- **Repo:** `/var/www/agon/app/` (git clone of this repo)
- **Web working dir:** `/var/www/agon/app/apps/web/` (PM2 cwd)
- **`.env.local`:** `/var/www/agon/app/apps/web/.env.local`
- **Stray file to remove:** `/var/www/agon/package-lock.json` (not part of repo)

### Process manager
- PM2, process name `agon-web`, id `0`, fork mode
- Next.js listens on **port 30000**
- Start/reload: `pm2 reload agon-web --update-env`
- Startup persisted via `pm2 save`

### Nginx
- Config: `/var/www/agon/app/nginx.conf` (also at `/etc/nginx/sites-enabled/`)
- HTTP → HTTPS redirect on port 80
- Reverse proxy `443 → localhost:30000`
- SSL via Let's Encrypt (`/etc/letsencrypt/live/agonimports.com/`)
- Static assets cached 60 min (`/_next/static`)

### CI/CD (GitHub Actions)
- **CI** (`.github/workflows/ci.yml`): typecheck + audit SDD + tests on push/PR to `main`
- **Deploy** (`.github/workflows/deploy.yml`): on push to `main` — builds `.env.local` from GitHub secrets, SCPs to VPS, SSHs to run `deploy.sh`, health checks `HEALTHCHECK_URL`
- **deploy.sh**: `git fetch + reset --hard`, `npm ci`, `npm run build`, `pm2 reload`

### GitHub Actions Secrets required
All must be set at `github.com/CaiuCarvalho/agon/settings/secrets/actions`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
VPS_HOST          # 187.127.13.56
VPS_USER          # root
VPS_PORT          # SSH port
VPS_SSH_KEY       # private key of ~/.ssh/github_actions on VPS
HEALTHCHECK_URL   # https://agonimports.com/api/health
```
> `NEXT_PUBLIC_APP_URL` is hardcoded as `https://agonimports.com` in the workflow (not a secret).

### Deploy workflow caveat
The deploy workflow **overwrites** `.env.local` on every run from GitHub secrets. Any variable not in secrets will be wiped. Keep all required env vars as secrets — do not rely on manual edits to `.env.local` on the VPS persisting across deploys.

## Monorepo Notes

Turborepo caches `.next/` build outputs. `turbo.json` defines task dependencies (`build` depends on `^build`). Dev tasks have `cache: false`. TypeScript uses a shared base config at `tsconfig.base.json`; each workspace extends it.

Workspaces: `apps/*` only. The `packages/` directory was removed (config, types, utils — all were empty stubs with zero imports).
