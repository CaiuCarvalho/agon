# Database Schema - Agon E-commerce

## Tabelas Implementadas

### profiles
Estende `auth.users` do Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS**: Usuários veem apenas próprio profile, admin vê todos.

---

### categories
Categorias de produtos.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) > 0 AND char_length(slug) <= 100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes**:
- `idx_categories_slug` ON slug

**RLS**: Leitura pública, escrita apenas admin.

---

### products
Catálogo de produtos.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) > 0 AND char_length(description) <= 2000),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  image_url TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  features TEXT[] DEFAULT '{}',
  rating DECIMAL(2, 1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews INTEGER DEFAULT 0 CHECK (reviews >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ NULL
);
```

**Indexes**:
- `idx_products_category_id` ON category_id
- `idx_products_deleted_at` ON deleted_at WHERE deleted_at IS NULL
- `idx_products_created_at` ON created_at DESC
- `idx_products_price` ON price
- `idx_products_name_search` ON to_tsvector('portuguese', name) USING gin
- `idx_products_description_search` ON to_tsvector('portuguese', description) USING gin

**RLS**: Leitura pública (apenas não deletados), escrita apenas admin.

---

### cart_items
Itens no carrinho do usuário.

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 99),
  size TEXT NOT NULL CHECK (char_length(size) > 0 AND char_length(size) <= 10),
  price_snapshot DECIMAL(10, 2) NOT NULL CHECK (price_snapshot > 0),
  product_name_snapshot TEXT NOT NULL CHECK (product_name_snapshot <> ''),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_cart_item UNIQUE (user_id, product_id, size)
);
```

**Indexes**:
- `idx_cart_items_user_id` ON user_id
- `idx_cart_items_product_id` ON product_id
- `idx_cart_items_updated_at` ON updated_at DESC

**RLS**: Usuário vê/edita apenas próprio carrinho.

**Triggers**:
- `update_cart_items_updated_at` - Atualiza updated_at automaticamente

---

### wishlist_items
Lista de desejos do usuário.

```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);
```

**Indexes**:
- `idx_wishlist_items_user_id` ON user_id
- `idx_wishlist_items_product_id` ON product_id
- `idx_wishlist_items_created_at` ON created_at DESC

**RLS**: Usuário vê/edita apenas própria wishlist.

**Triggers**:
- `enforce_wishlist_limit` - Limita 20 itens por usuário

---

### orders (em desenvolvimento)
Pedidos finalizados.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL CHECK (shipping_state IN ('AC', 'AL', 'AP', ...)),
  shipping_zip TEXT NOT NULL CHECK (shipping_zip ~ '^\d{5}-\d{3}$'),
  shipping_phone TEXT NOT NULL CHECK (shipping_phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'),
  shipping_email TEXT NOT NULL CHECK (shipping_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes**:
- `idx_orders_user_id` ON user_id
- `idx_orders_status` ON status
- `idx_orders_created_at` ON created_at DESC

**RLS**: Usuário vê apenas próprios pedidos, admin vê todos.

---

### order_items (em desenvolvimento)
Itens dentro de pedidos.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL CHECK (char_length(product_name) > 0),
  product_price DECIMAL(10, 2) NOT NULL CHECK (product_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  size TEXT CHECK (size IS NULL OR char_length(size) <= 10),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes**:
- `idx_order_items_order_id` ON order_id
- `idx_order_items_product_id` ON product_id

**RLS**: Usuário vê itens de próprios pedidos.

---

## RPC Functions

### migrate_cart_items
Migra carrinho de localStorage para banco ao fazer login.

```sql
CREATE FUNCTION migrate_cart_items(p_user_id UUID, p_items JSONB)
RETURNS JSONB;
```

### migrate_wishlist_items
Migra wishlist de localStorage para banco ao fazer login.

```sql
CREATE FUNCTION migrate_wishlist_items(p_user_id UUID, p_items JSONB)
RETURNS JSONB;
```

### add_to_cart_atomic
Adiciona item ao carrinho de forma atômica (upsert).

```sql
CREATE FUNCTION add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT,
  p_price_snapshot DECIMAL,
  p_product_name_snapshot TEXT
) RETURNS JSONB;
```

### create_order_atomic (em desenvolvimento)
Cria pedido atomicamente (order + order_items + limpa carrinho).

```sql
CREATE FUNCTION create_order_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  ...
) RETURNS JSONB;
```

---

## Migrations

Migrations estão em `supabase/migrations/` com timestamp:

- `20260404000001_create_cart_items_table.sql`
- `20260404000002_create_wishlist_items_table.sql`
- `20260404000003_create_wishlist_limit_trigger.sql`
- `20260404000004_create_cart_migration_rpc.sql`
- `20260404000005_create_wishlist_migration_rpc.sql`
- `20260404000006_create_add_to_cart_atomic_rpc.sql`
- `20260404000007_add_cart_items_cross_field_constraints.sql`
- `20260404000008_create_rate_limit_log_table.sql`
- `20260405000001_create_orders_table.sql` (em desenvolvimento)
- `20260405000002_create_order_items_table.sql` (em desenvolvimento)
- `20260405000003_create_orders_rls_policies.sql` (em desenvolvimento)
- `20260405000004_create_order_items_rls_policies.sql` (em desenvolvimento)
- `20260405000005_create_order_atomic_rpc.sql` (em desenvolvimento)

---

## Como Aplicar Migrations

### Via Supabase Dashboard (Recomendado)
1. Acesse SQL Editor no dashboard
2. Copie conteúdo do arquivo de migration
3. Execute

### Via CLI (se configurado)
```bash
supabase db push
```

---

## Constraints Importantes

### Foreign Keys
- `ON DELETE CASCADE`: Deleta dados dependentes (cart_items, wishlist_items)
- `ON DELETE RESTRICT`: Impede deleção se há dependentes (products em orders)

### Check Constraints
- Validam dados no nível do banco
- Garantem integridade mesmo se frontend falhar

### Unique Constraints
- Previnem duplicatas
- Usados para idempotência

---

## RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Políticas padrão:

**Para usuários comuns**:
- SELECT: Apenas próprios dados
- INSERT: Apenas para si mesmo
- UPDATE: Apenas próprios dados
- DELETE: Apenas próprios dados

**Para admin**:
- SELECT: Todos os dados
- INSERT: Qualquer dado
- UPDATE: Qualquer dado
- DELETE: Qualquer dado

**Para dados públicos** (products, categories):
- SELECT: Todos (sem autenticação)
- INSERT/UPDATE/DELETE: Apenas admin
