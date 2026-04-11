# Tech Stack

## Build System

**Turborepo** monorepo with npm workspaces. Node.js 18+ required.

## Frontend Stack

- **Framework**: Next.js 15 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS 3, Radix UI components, Framer Motion animations
- **State**: React Context (Auth, Wishlist), TanStack Query for server state
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI primitives (Dialog, Toast, Tabs, Avatar, etc.)

## Backend Stack

- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Auth (JWT-based, email/password)
- **Real-time**: Supabase Realtime subscriptions
- **API**: Next.js Server Actions (no separate REST API)
- **Payments**: Mercado Pago SDK (webhook-based)
- **Email**: Resend (optional)
- **Images**: Cloudinary (optional, for admin uploads)

## Testing

- **Framework**: Vitest with @vitest/ui
- **Property-Based Testing**: fast-check with @fast-check/vitest
- **Test Types**: Bug condition tests, preservation tests

## Common Commands

```bash
# Development
npm install              # Install all dependencies
npm run dev             # Start dev server (localhost:3000)

# Build & Production
npm run build           # Build all apps
npm start               # Start production server (web app only)

# Testing
npm run test            # Run all tests (vitest --run)
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Open Vitest UI

# Audit (SDD Methodology)
npm run audit           # Run SDD audit + scoring
```

## Environment Variables

Required in `apps/web/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `MERCADOPAGO_ACCESS_TOKEN` - Mercado Pago API token (server-only)
- `MERCADOPAGO_WEBHOOK_SECRET` - Webhook validation secret
- `NEXT_PUBLIC_APP_URL` - App base URL

Optional:
- `RESEND_API_KEY` - Email service
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Image uploads
- `ADMIN_EMAIL_PRIMARY` / `ADMIN_EMAIL_BACKUP` - Admin access control

See `.env.example` for complete list.

## Key Libraries

- **lucide-react**: Icon library
- **sonner**: Toast notifications
- **date-fns**: Date formatting
- **clsx** + **tailwind-merge**: Conditional CSS classes
- **input-otp**: OTP input component
- **js-cookie**: Cookie management
