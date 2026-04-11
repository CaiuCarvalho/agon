# Project Structure

## Monorepo Organization

```
agon/
├── apps/                    # Applications
│   ├── web/                # Next.js frontend (main app)
│   └── api/                # Fastify API (stub, not actively used)
├── packages/               # Shared packages
│   ├── config/            # Shared configurations
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utilities
├── supabase/              # Database migrations and seeds
│   └── migrations/        # SQL migration files
├── reference/             # Technical documentation
│   ├── architecture/      # System design docs
│   ├── domain/           # Domain rules and business logic
│   └── engineering/      # Coding standards
├── scripts/              # Automation scripts (SDD audit)
└── .kiro/                # Kiro AI configuration
    ├── specs/            # Feature specs (SDD methodology)
    └── steering/         # AI guidance rules
```

## Web App Structure (`apps/web/src/`)

### Core Directories

- **`app/`** - Next.js App Router pages and layouts
  - `(auth)/` - Auth pages (login, cadastro) with route group
  - `admin/` - Admin panel pages (products, orders, dashboard)
  - `api/` - API routes (webhooks, admin endpoints)
  - `cart/`, `checkout/`, `favoritos/`, `perfil/`, `products/` - Feature pages
  - `page.tsx` - Homepage
  - `layout.tsx` - Root layout with providers

- **`components/`** - React components organized by feature
  - `ui/` - Reusable UI primitives (Button, Dialog, Input, etc.) - NO business logic
  - `auth/`, `cart/`, `checkout/`, `products/`, `profile/` - Feature-specific components
  - Root-level: Shared layout components (Navbar, Footer, Hero, etc.)

- **`modules/`** - Feature modules with business logic
  - `address/`, `admin/`, `cart/`, `checkout/`, `payment/`, `products/`, `wishlist/`
  - Each module contains: actions, hooks, services, types, utils
  - Server Actions live here (e.g., `cart/actions.ts`)

- **`lib/`** - Core utilities and configurations
  - `supabase/` - Supabase client setup (server, client, middleware)
  - `api/` - API client utilities
  - `react-query/` - TanStack Query setup
  - `utils/` - Helper functions

- **`context/`** - React Context providers (AuthContext, WishlistContext)

- **`hooks/`** - Custom React hooks (useAuth, use-toast, use-mobile, etc.)

- **`types/`** - TypeScript type definitions (cart, order, address, etc.)

- **`utils/`** - Utility functions (validation, formatting)

- **`__tests__/`** - Test files (bug condition, preservation tests)

## Naming Conventions

- **Folders**: `kebab-case` (e.g., `shopping-cart`, `payment-methods`)
- **Components**: `PascalCase` matching filename (e.g., `ProductCard.tsx`)
- **Functions/Hooks**: `camelCase` (e.g., `useAuth`, `formatCurrency`)
- **Booleans**: Prefix with `is`, `has`, `should` (e.g., `isValidEmail`)
- **Types/Interfaces**: `PascalCase`, no `I` prefix (e.g., `User`, not `IUser`)

## Import Organization

1. React/Next imports first
2. External libraries (alphabetical)
3. Internal imports using `@/` alias (NEVER use `../../../`)
4. Local types/interfaces

## Component Architecture

- **UI Components** (`components/ui/`): Pure presentation, no server actions, props-driven
- **Feature Components** (`components/[feature]/`): Feature-specific, can use hooks and context
- **Modules** (`modules/[feature]/`): Business logic, server actions, data fetching
- **Pages** (`app/`): Route handlers, compose components and modules

## Database Migrations

Located in `supabase/migrations/`, named with timestamp prefix:
- Format: `YYYYMMDD_description.sql`
- Include RLS policies, indexes, and comments
- Use `SECURITY DEFINER` for RPC functions that need elevated privileges

## Spec-Driven Development

Specs in `.kiro/specs/[feature-name]/`:
- `requirements.md` or `bugfix.md` - Requirements/bug description
- `design.md` - Technical design
- `tasks.md` - Implementation checklist
- `.config.kiro` - Spec metadata (workflow type, spec type)

## Key Patterns

- **Server Actions**: Defined in `modules/[feature]/actions.ts`, called from client components
- **Real-time Sync**: Supabase subscriptions in context providers or hooks
- **Form Validation**: Zod schemas in `utils/validation.ts` or module-level
- **API Routes**: Only for webhooks and external integrations (`app/api/`)
- **Admin Protection**: Email whitelist + role check in middleware and API routes
