# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agon is a Brazilian e-commerce platform (sports apparel) built as a Turborepo monorepo with npm workspaces. The main application lives in `apps/web/` (Next.js 15 with App Router). `apps/api/` is a stub Fastify API. Shared code lives in `packages/`.

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

`apps/web/src/middleware.ts` protects routes using Supabase session checks with a 5-second timeout. Protected paths: `/admin`, `/perfil`, `/checkout`, `/pedido`.

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

## Key Integrations

- **Supabase** — auth, database (PostgreSQL + RLS), realtime subscriptions
- **Mercado Pago** — payment processing; webhook at `/api/webhooks/mercadopago`
- **Cloudinary** — image hosting and upload presets
- **Resend** — transactional email

## Monorepo Notes

Turborepo caches `dist/` and `.next/` build outputs. `turbo.json` defines task dependencies (`build` depends on `^build`). Dev tasks have `cache: false`. TypeScript uses a shared base config at `tsconfig.base.json`; each workspace extends it.
