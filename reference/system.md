# System Architecture - Agon E-commerce

## Stack Real

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Styling**: Tailwind CSS v3
- **State**: React Query + Context API
- **Validation**: Zod
- **Monorepo**: Turborepo

## Estrutura de Pastas

```
agon/
├── apps/
│   └── web/                    # Next.js app principal
│       └── src/
│           ├── app/            # App Router (pages e layouts)
│           ├── components/     # Componentes React reutilizáveis
│           ├── modules/        # Módulos de domínio (cart, wishlist, products, checkout)
│           ├── lib/            # Utilitários e clientes (Supabase, API)
│           ├── hooks/          # Custom React hooks
│           ├── context/        # Context providers
│           ├── types/          # TypeScript types
│           └── utils/          # Funções utilitárias
├── supabase/
│   └── migrations/             # Database migrations
├── .kiro/
│   └── specs/                  # Specs SDD (requirements, design, tasks)
├── reference/                  # Documentação de referência (ESTE ARQUIVO)
└── specs/                      # Specs de features antigas
```

## Como Funciona

### Frontend → Backend
1. **Componentes** chamam **hooks** (ex: `useCart`, `useProducts`)
2. **Hooks** chamam **services** (ex: `cartService`, `productService`)
3. **Services** chamam **Supabase client** (queries, mutations, RPC)
4. **Supabase** retorna dados (com RLS aplicado)

### Realtime Sync
- Hooks subscrevem canais Supabase Realtime
- Mudanças no banco disparam eventos
- UI atualiza automaticamente

### Autenticação
- Supabase Auth gerencia sessões
- Middleware Next.js protege rotas
- RLS policies isolam dados por usuário

## Módulos Implementados

### ✅ Cart & Wishlist (`/modules/cart`, `/modules/wishlist`)
- Persistência dual (DB + localStorage)
- Realtime sync entre dispositivos
- Migração automática no login
- Optimistic UI com rollback

### ✅ Products (`/modules/products`)
- CRUD de produtos (admin)
- Listagem com filtros
- Busca com debounce
- Upload de imagens

### 🚧 Checkout (`/modules/checkout`)
- Em desenvolvimento
- Criação de pedidos
- Validação de estoque
- Integração com Stripe (futuro)

## Database (Supabase)

### Tabelas Principais
- `profiles` - Dados de usuário
- `products` - Catálogo de produtos
- `categories` - Categorias de produtos
- `cart_items` - Itens no carrinho
- `wishlist_items` - Lista de desejos
- `orders` - Pedidos (em desenvolvimento)
- `order_items` - Itens dos pedidos (em desenvolvimento)

### RLS (Row Level Security)
- Todas as tabelas têm RLS habilitado
- Usuários só acessam seus próprios dados
- Admin tem permissões especiais

## Fluxo de Desenvolvimento (SDD)

1. **Spec** - Criar requirements.md, design.md, tasks.md em `.kiro/specs/`
2. **Database** - Aplicar migrations em `supabase/migrations/`
3. **Services** - Implementar lógica de negócio em `modules/*/services/`
4. **Hooks** - Criar hooks React em `modules/*/hooks/`
5. **UI** - Implementar componentes em `components/` e páginas em `app/`
6. **Tests** - Escrever testes em `__tests__/`

## Regras Importantes

- **Sem código sem spec** - Toda feature precisa de spec em `.kiro/specs/`
- **Services puros** - Services não conhecem UI (sem toasts, navegação)
- **Hooks orquestram** - Hooks gerenciam estado e chamam services
- **Componentes burros** - Componentes recebem props e emitem eventos
- **Validação Zod** - Toda entrada de dados usa Zod schemas
- **RLS sempre** - Nunca confiar no frontend, RLS protege dados

## Próximas Features

Ver `specs/ROADMAP.md` para lista completa e prioridades.
