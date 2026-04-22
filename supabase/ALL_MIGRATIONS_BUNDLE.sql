-- =============================================================================
-- AGON — CONSOLIDATED SUPABASE MIGRATIONS
-- Gerado por scripts/build-migrations-sql.sh
-- =============================================================================
-- Copie TODO este arquivo e rode uma vez no SQL Editor do projeto Supabase
-- (staging primeiro, depois produção). As migrações são idempotentes o
-- suficiente (usam IF NOT EXISTS / DROP POLICY IF EXISTS); rodar de novo
-- é seguro, mas prefira aplicar uma vez por ambiente.
-- =============================================================================

BEGIN;


-- -----------------------------------------------------------------------------
-- Migration: 20250405000000_bootstrap_core_schema.sql
-- -----------------------------------------------------------------------------

-- Migration: Bootstrap core schema
-- Date: 2025-04-05
-- Description: Cria as tabelas fundacionais (profiles, categories, products,
-- addresses) + trigger on_auth_user_created. Idempotente: usa IF NOT EXISTS
-- em tudo, então aplicar em ambiente onde as tabelas já existem é seguro.
-- Existia um descompasso: as tabelas dependentes (cart_items, orders, etc.)
-- tinham migration, mas as fundacionais estavam criadas ad-hoc no Dashboard.
-- Staging recém-provisionado ficou sem nenhuma tabela; esta migration resolve.

-- ============================================================================
-- 1. Extensões necessárias
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. Tabela profiles (1:1 com auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  tax_id TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema drift guard: em prod a tabela profiles foi criada manualmente no
-- Dashboard e pode estar faltando colunas. ADD COLUMN IF NOT EXISTS garante
-- que todas as colunas esperadas existam antes do INSERT/UPDATE abaixo.
-- Não impõe NOT NULL pra não quebrar linhas pré-existentes.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política básica. As migrations posteriores (20260411011908) substituem
-- por versões otimizadas via DROP POLICY IF EXISTS + CREATE.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. Trigger: auto-criar profile quando auth.users recebe novo registro
-- ============================================================================
-- A função handle_new_user() é criada/atualizada em
-- 20260411011412_fix_security_and_performance_part2.sql. Aqui só garantimos
-- que o trigger exista. DROP + CREATE para idempotência.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Stub da função para o trigger poder ser criado aqui. Migration
-- 20260411011412 sobrescreve com a versão segura (search_path = '').
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. Backfill de profiles para auth.users pré-existentes
-- ============================================================================
-- Em staging/prod onde a tabela profiles foi criada tarde (ou nunca), usuários
-- cadastrados antes do trigger não têm profile. Esta linha resolve sem quebrar
-- nada em ambiente onde tudo já está ok (ON CONFLICT DO NOTHING).

INSERT INTO public.profiles (id, email, name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. Tabela categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) > 0 AND char_length(slug) <= 100),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  TO public
  USING (true);

-- Seed das categorias usadas pelo seed-products.sql
INSERT INTO public.categories (name, slug, description) VALUES
  ('Manto Oficial', 'manto-oficial', 'Camisas oficiais de times nacionais e internacionais'),
  ('Seleção', 'selecao', 'Camisas oficiais de seleções'),
  ('Acessórios', 'acessorios', 'Acessórios esportivos e de torcedor'),
  ('Outros', 'outros', 'Outros produtos')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. Tabela products
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) > 0 AND char_length(description) <= 2000),
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  image_url TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  features TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
  unlimited_stock BOOLEAN NOT NULL DEFAULT FALSE,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products (deleted_at);

-- RLS é habilitado/politicada em 20260407000001_enable_products_public_access.sql
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Tabela addresses
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL CHECK (char_length(zip_code) = 8),
  street TEXT NOT NULL CHECK (char_length(street) >= 3),
  number TEXT NOT NULL CHECK (char_length(number) >= 1),
  complement TEXT,
  neighborhood TEXT NOT NULL CHECK (char_length(neighborhood) >= 2),
  city TEXT NOT NULL CHECK (char_length(city) >= 2),
  state TEXT NOT NULL CHECK (char_length(state) = 2),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Políticas básicas; migration 20260411011952 refina.
DROP POLICY IF EXISTS "Users can read own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can read own addresses" ON public.addresses;
CREATE POLICY "Users can read own addresses"
  ON public.addresses FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON public.addresses;
CREATE POLICY "Users can create own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses"
  ON public.addresses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- Migration: 20260404000001_create_cart_items_table.sql
-- -----------------------------------------------------------------------------

-- Create cart_items table with price snapshots and RLS policies
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 12.1, 12.3, 12.5, 14.1, 14.3, 16.1, 16.2

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 99),
  size TEXT NOT NULL CHECK (char_length(size) > 0 AND char_length(size) <= 10),
  
  -- Price snapshot fields for historical accuracy
  price_snapshot DECIMAL(10, 2) NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one entry per (user, product, size) combination
  CONSTRAINT unique_cart_item UNIQUE (user_id, product_id, size)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own cart items
DROP POLICY IF EXISTS "cart_items_select_own" ON cart_items;
CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own cart items
DROP POLICY IF EXISTS "cart_items_insert_own" ON cart_items;
CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own cart items
DROP POLICY IF EXISTS "cart_items_update_own" ON cart_items;
CREATE POLICY "cart_items_update_own"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own cart items
DROP POLICY IF EXISTS "cart_items_delete_own" ON cart_items;
CREATE POLICY "cart_items_delete_own"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE cart_items IS 'Shopping cart items for authenticated users with price snapshots for historical accuracy';
COMMENT ON COLUMN cart_items.price_snapshot IS 'Product price at the time of adding to cart';
COMMENT ON COLUMN cart_items.product_name_snapshot IS 'Product name at the time of adding to cart';


-- -----------------------------------------------------------------------------
-- Migration: 20260404000002_create_wishlist_items_table.sql
-- -----------------------------------------------------------------------------

-- Create wishlist_items table with RLS policies
-- Requirements: 7.1, 7.2, 7.3, 11.1, 11.2, 11.3, 11.4, 12.2, 12.4, 12.6, 14.2, 14.4

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one entry per (user, product) combination
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON wishlist_items(created_at DESC);

-- Enable Row Level Security
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own wishlist items
DROP POLICY IF EXISTS "wishlist_items_select_own" ON wishlist_items;
CREATE POLICY "wishlist_items_select_own"
  ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own wishlist items
DROP POLICY IF EXISTS "wishlist_items_insert_own" ON wishlist_items;
CREATE POLICY "wishlist_items_insert_own"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own wishlist items
DROP POLICY IF EXISTS "wishlist_items_delete_own" ON wishlist_items;
CREATE POLICY "wishlist_items_delete_own"
  ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE wishlist_items IS 'Wishlist (favorites) items for authenticated users with 20-item limit';


-- -----------------------------------------------------------------------------
-- Migration: 20260404000003_create_wishlist_limit_trigger.sql
-- -----------------------------------------------------------------------------

-- Create wishlist limit enforcement trigger
-- Requirements: 8.1, 8.2, 8.3, 8.4

-- Function to enforce 20-item wishlist limit atomically
CREATE OR REPLACE FUNCTION check_wishlist_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM wishlist_items WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 itens na wishlist atingido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce limit before insert
DROP TRIGGER IF EXISTS enforce_wishlist_limit ON wishlist_items;
CREATE TRIGGER enforce_wishlist_limit
  BEFORE INSERT ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION check_wishlist_limit();

-- Add comment for documentation
COMMENT ON FUNCTION check_wishlist_limit() IS 'Enforces 20-item limit per user on wishlist_items table';


-- -----------------------------------------------------------------------------
-- Migration: 20260404000004_create_cart_migration_rpc.sql
-- -----------------------------------------------------------------------------

-- Atomic cart migration function
-- Requirements: 3.1, 3.2, 3.3, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6

-- Function to migrate cart items from localStorage to database
-- Ensures all cart items are migrated in a single transaction
CREATE OR REPLACE FUNCTION migrate_cart_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_product RECORD;
BEGIN
  -- Iterate through items and insert/update atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Fetch product details for snapshot
    SELECT price, name INTO v_product
    FROM products
    WHERE id = (v_item->>'productId')::UUID
      AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      -- Skip items with invalid product_id
      CONTINUE;
    END IF;
    
    -- Atomic upsert: insert or update if exists
    INSERT INTO cart_items (
      user_id,
      product_id,
      quantity,
      size,
      price_snapshot,
      product_name_snapshot
    )
    VALUES (
      p_user_id,
      (v_item->>'productId')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_item->>'size',
      v_product.price,
      v_product.name
    )
    ON CONFLICT (user_id, product_id, size)
    DO UPDATE SET
      quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
      updated_at = NOW();
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION migrate_cart_items(UUID, JSONB) IS 'Atomically migrates cart items from localStorage to database with automatic rollback on failure';


-- -----------------------------------------------------------------------------
-- Migration: 20260404000005_create_wishlist_migration_rpc.sql
-- -----------------------------------------------------------------------------

-- Atomic wishlist migration function
-- Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6

-- Function to migrate wishlist items from localStorage to database
-- Ensures all wishlist items are migrated in a single transaction
CREATE OR REPLACE FUNCTION migrate_wishlist_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_current_count INTEGER;
  v_inserted BOOLEAN;
BEGIN
  -- Check current wishlist count
  SELECT COUNT(*) INTO v_current_count
  FROM wishlist_items
  WHERE user_id = p_user_id;
  
  -- Iterate through items up to the 20-item limit
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Stop if we've reached the limit
    IF v_current_count >= 20 THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    -- Insert if not exists (idempotent)
    INSERT INTO wishlist_items (user_id, product_id)
    VALUES (p_user_id, (v_item->>'productId')::UUID)
    ON CONFLICT (user_id, product_id) DO NOTHING
    RETURNING true INTO v_inserted;
    
    -- Check if insert was successful
    IF v_inserted THEN
      v_migrated_count := v_migrated_count + 1;
      v_current_count := v_current_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count,
    'skipped_count', v_skipped_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION migrate_wishlist_items(UUID, JSONB) IS 'Atomically migrates wishlist items from localStorage to database with 20-item limit enforcement';


-- -----------------------------------------------------------------------------
-- Migration: 20260404000006_create_add_to_cart_atomic_rpc.sql
-- -----------------------------------------------------------------------------

-- Atomic add to cart function
-- Requirements: 1.1, 14.3, 14.5

-- Function to atomically add item to cart with price snapshot
-- Prevents race conditions by using INSERT ... ON CONFLICT DO UPDATE
CREATE OR REPLACE FUNCTION add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_result RECORD;
BEGIN
  -- Validate quantity
  IF p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quantidade deve ser entre 1 e 99'
    );
  END IF;
  
  -- Validate size
  IF char_length(p_size) < 1 OR char_length(p_size) > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tamanho deve ter entre 1 e 10 caracteres'
    );
  END IF;
  
  -- Fetch product details
  SELECT price, name, stock INTO v_product
  FROM products
  WHERE id = p_product_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Produto não encontrado'
    );
  END IF;
  
  -- Atomic upsert: insert or update if exists
  INSERT INTO cart_items (
    user_id,
    product_id,
    quantity,
    size,
    price_snapshot,
    product_name_snapshot
  )
  VALUES (
    p_user_id,
    p_product_id,
    p_quantity,
    p_size,
    v_product.price,
    v_product.name
  )
  ON CONFLICT (user_id, product_id, size)
  DO UPDATE SET
    quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'item', row_to_json(v_result)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION add_to_cart_atomic(UUID, UUID, INTEGER, TEXT) IS 'Atomically adds item to cart with price snapshot, preventing race conditions';


-- -----------------------------------------------------------------------------
-- Migration: 20260404000007_add_cart_items_cross_field_constraints.sql
-- -----------------------------------------------------------------------------

-- Add cross-field validation constraints to cart_items table
-- Requirements: 33.1, 33.2, 33.3, 33.4

-- Add CHECK constraint: price_snapshot must be positive
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_price_snapshot_positive;
ALTER TABLE cart_items
ADD CONSTRAINT check_price_snapshot_positive
CHECK (price_snapshot > 0);

-- Add CHECK constraint: product_name_snapshot must not be empty
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_product_name_not_empty;
ALTER TABLE cart_items
ADD CONSTRAINT check_product_name_not_empty
CHECK (product_name_snapshot != '' AND char_length(product_name_snapshot) > 0);

-- Add CHECK constraint: prevent overflow (quantity * price_snapshot <= 999999)
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_total_price_overflow;
ALTER TABLE cart_items
ADD CONSTRAINT check_total_price_overflow
CHECK (quantity * price_snapshot <= 999999);

-- Add CHECK constraint: created_at must be before or equal to updated_at
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_timestamps_order;
ALTER TABLE cart_items
ADD CONSTRAINT check_timestamps_order
CHECK (created_at <= updated_at);

-- Add comments for documentation
COMMENT ON CONSTRAINT check_price_snapshot_positive ON cart_items IS 'Ensures price_snapshot is always positive';
COMMENT ON CONSTRAINT check_product_name_not_empty ON cart_items IS 'Ensures product_name_snapshot is never empty';
COMMENT ON CONSTRAINT check_total_price_overflow ON cart_items IS 'Prevents arithmetic overflow by limiting total price to 999999';
COMMENT ON CONSTRAINT check_timestamps_order ON cart_items IS 'Ensures created_at is always before or equal to updated_at';


-- -----------------------------------------------------------------------------
-- Migration: 20260404000008_create_rate_limit_log_table.sql
-- -----------------------------------------------------------------------------

-- Migration: Create rate_limit_log table for rate limiting
-- Requirements: 30, 31
-- Description: Creates a table to track user operations for rate limiting (60 requests per minute)

-- Create rate_limit_log table
CREATE TABLE IF NOT EXISTS rate_limit_log (
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, operation, timestamp)
);

-- Create index for efficient rate limit queries
-- This index allows fast lookups of recent requests by user
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_user_time 
  ON rate_limit_log(user_id, timestamp DESC);

-- Add comment to table for documentation
COMMENT ON TABLE rate_limit_log IS 'Logs user operations for rate limiting enforcement (60 requests per minute per user)';
COMMENT ON COLUMN rate_limit_log.user_id IS 'UUID of the user making the request';
COMMENT ON COLUMN rate_limit_log.operation IS 'Name of the operation being rate limited (e.g., cart_items, wishlist_items)';
COMMENT ON COLUMN rate_limit_log.timestamp IS 'Timestamp when the operation was performed';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000001_create_orders_table.sql
-- -----------------------------------------------------------------------------

-- Create orders table for storing customer orders
-- Requirements: 1.1-1.17

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Financial information
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- Shipping information
  shipping_name TEXT NOT NULL CHECK (char_length(shipping_name) > 0 AND char_length(shipping_name) <= 200),
  shipping_address TEXT NOT NULL CHECK (char_length(shipping_address) > 0 AND char_length(shipping_address) <= 500),
  shipping_city TEXT NOT NULL CHECK (char_length(shipping_city) > 0 AND char_length(shipping_city) <= 100),
  shipping_state TEXT NOT NULL CHECK (shipping_state IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')),
  shipping_zip TEXT NOT NULL CHECK (shipping_zip ~ '^\d{5}-\d{3}$'),
  shipping_phone TEXT NOT NULL CHECK (shipping_phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'),
  shipping_email TEXT NOT NULL CHECK (shipping_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  
  -- Payment information
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Add comment for documentation
COMMENT ON TABLE orders IS 'Stores customer orders with shipping information and payment method';
COMMENT ON COLUMN orders.status IS 'Order status: pending, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.total_amount IS 'Total order amount in Brazilian Real (BRL)';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: cash_on_delivery (MVP only)';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000002_create_order_items_table.sql
-- -----------------------------------------------------------------------------

-- Create order_items table for storing products in each order
-- Requirements: 2.1-2.11, 20.1-20.5

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Product snapshot (immutable historical data)
  product_name TEXT NOT NULL CHECK (char_length(product_name) > 0),
  product_price DECIMAL(10, 2) NOT NULL CHECK (product_price >= 0),
  
  -- Order details
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  size TEXT CHECK (size IS NULL OR char_length(size) <= 10),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Add comments for documentation
COMMENT ON TABLE order_items IS 'Stores individual items within each order with price snapshots';
COMMENT ON COLUMN order_items.product_name IS 'Product name snapshot at time of order (immutable)';
COMMENT ON COLUMN order_items.product_price IS 'Product price snapshot at time of order (immutable)';
COMMENT ON COLUMN order_items.subtotal IS 'Calculated as product_price * quantity';
COMMENT ON COLUMN order_items.size IS 'Product size/variant (optional, e.g., P, M, G)';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000003_create_orders_rls_policies.sql
-- -----------------------------------------------------------------------------

-- Create RLS policies for orders table
-- Requirements: 3.1-3.4

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own orders
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own orders
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own orders, admins can update any order
DROP POLICY IF EXISTS "orders_update_own_or_admin" ON orders;
CREATE POLICY "orders_update_own_or_admin"
  ON orders FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete orders
DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "orders_select_own" ON orders IS 'Users can only view their own orders';
COMMENT ON POLICY "orders_insert_own" ON orders IS 'Users can only create orders for themselves';
COMMENT ON POLICY "orders_update_own_or_admin" ON orders IS 'Users can update their own orders, admins can update any';
COMMENT ON POLICY "orders_delete_admin" ON orders IS 'Only admins can delete orders';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000004_create_order_items_rls_policies.sql
-- -----------------------------------------------------------------------------

-- Create RLS policies for order_items table
-- Requirements: 3.5-3.6

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read order items for their own orders
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Users can only insert order items for their own orders
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Only admins can update order items
DROP POLICY IF EXISTS "order_items_update_admin" ON order_items;
CREATE POLICY "order_items_update_admin"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete order items
DROP POLICY IF EXISTS "order_items_delete_admin" ON order_items;
CREATE POLICY "order_items_delete_admin"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "order_items_select_own" ON order_items IS 'Users can only view items from their own orders';
COMMENT ON POLICY "order_items_insert_own" ON order_items IS 'Users can only create items for their own orders';
COMMENT ON POLICY "order_items_update_admin" ON order_items IS 'Only admins can update order items';
COMMENT ON POLICY "order_items_delete_admin" ON order_items IS 'Only admins can delete order items';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000005_create_order_atomic_rpc.sql
-- -----------------------------------------------------------------------------

-- Create atomic order creation RPC function
-- Requirements: 8.1-8.7, 9.1-9.7, 10.1-10.7, 11.1-11.5

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
BEGIN
  -- Validate cart is not empty
  SELECT COUNT(*) INTO v_item_count
  FROM cart_items
  WHERE user_id = p_user_id;
  
  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;
  
  -- Create order record with initial total of 0
  INSERT INTO orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0, -- Will be updated after calculating items
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  -- Process each cart item
  FOR v_cart_item IN
    SELECT * FROM cart_items WHERE user_id = p_user_id
  LOOP
    -- Fetch current product data (excluding soft-deleted products)
    SELECT id, name, price, stock INTO v_product
    FROM products
    WHERE id = v_cart_item.product_id
    AND deleted_at IS NULL;
    
    -- Validate product exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_cart_item.product_id;
    END IF;
    
    -- Validate stock availability
    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Product % has insufficient stock (available: %, requested: %)',
        v_product.name, v_product.stock, v_cart_item.quantity;
    END IF;
    
    -- Calculate subtotal
    v_subtotal := v_product.price * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;
    
    -- Insert order item with price snapshot
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;
  
  -- Update order total
  UPDATE orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;
  
  -- Clear cart
  DELETE FROM cart_items WHERE user_id = p_user_id;
  
  -- Return success with order data
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION create_order_atomic IS 'Atomically creates an order with items and clears the cart. All operations succeed or all fail (no partial state).';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000010_mercadopago_payments.sql
-- -----------------------------------------------------------------------------

-- Migration: Mercado Pago Payments Integration
-- Description: Creates payments table, RPC functions, and updates orders table for Mercado Pago integration
-- Date: 2025-04-06

-- ============================================
-- 1. Create payments table
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to orders (1:1 relationship)
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  
  -- Mercado Pago identifiers
  mercadopago_payment_id TEXT NULL, -- Set when webhook received
  mercadopago_preference_id TEXT NOT NULL, -- Set when preference created
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')
  ),
  
  -- Payment details
  payment_method TEXT NULL, -- e.g., 'credit_card', 'pix', 'boleto'
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_payment_id ON payments(mercadopago_payment_id) WHERE mercadopago_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_preference_id ON payments(mercadopago_preference_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- 3. Create trigger for updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Add comments
-- ============================================

COMMENT ON TABLE payments IS 'Stores Mercado Pago payment transactions linked to orders';
COMMENT ON COLUMN payments.mercadopago_payment_id IS 'Mercado Pago payment ID, set when webhook is received';
COMMENT ON COLUMN payments.mercadopago_preference_id IS 'Mercado Pago preference ID, set when preference is created';
COMMENT ON COLUMN payments.status IS 'Payment status from Mercado Pago: pending, approved, rejected, cancelled, refunded, in_process';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used: credit_card, debit_card, pix, boleto, account_money';

-- ============================================
-- 5. Enable RLS
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS policies
-- ============================================

-- Policy: Users can only read payments for their own orders
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Users can only insert payments for their own orders
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Only system (via RPC) or admin can update payments
DROP POLICY IF EXISTS "payments_update_system_or_admin" ON payments;
CREATE POLICY "payments_update_system_or_admin"
  ON payments FOR UPDATE
  USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    -- Or allow if user owns the order (for webhook processing)
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Only admins can delete payments
DROP POLICY IF EXISTS "payments_delete_admin" ON payments;
CREATE POLICY "payments_delete_admin"
  ON payments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 7. Update orders table payment_method constraint
-- ============================================

-- Drop existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add new constraint with Mercado Pago methods
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN (
    'cash_on_delivery',
    'mercadopago_credit_card',
    'mercadopago_debit_card',
    'mercadopago_pix',
    'mercadopago_boleto',
    'mercadopago_account_money'
  ));

-- Update default payment method
ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'mercadopago_credit_card';

-- ============================================
-- 8. Create RPC function: create_order_with_payment_atomic
-- ============================================

CREATE OR REPLACE FUNCTION create_order_with_payment_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT,
  p_mercadopago_preference_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
  v_payment_id UUID;
BEGIN
  -- Validate cart is not empty
  SELECT COUNT(*) INTO v_item_count
  FROM cart_items
  WHERE user_id = p_user_id;
  
  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;
  
  -- Create order record
  INSERT INTO orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0, -- Will be updated after calculating items
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  -- Process each cart item
  FOR v_cart_item IN
    SELECT * FROM cart_items WHERE user_id = p_user_id
  LOOP
    -- Fetch current product data
    SELECT id, name, price, stock INTO v_product
    FROM products
    WHERE id = v_cart_item.product_id
    AND deleted_at IS NULL;
    
    -- Validate product exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_cart_item.product_id;
    END IF;
    
    -- Validate stock availability
    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Product % has insufficient stock (available: %, requested: %)',
        v_product.name, v_product.stock, v_cart_item.quantity;
    END IF;
    
    -- Calculate subtotal
    v_subtotal := v_product.price * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;
    
    -- Insert order item with price snapshot
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;
  
  -- Update order total
  UPDATE orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;
  
  -- Create payment record
  INSERT INTO payments (
    order_id,
    mercadopago_preference_id,
    status,
    amount
  )
  VALUES (
    v_order_id,
    p_mercadopago_preference_id,
    'pending',
    v_total_amount
  )
  RETURNING id INTO v_payment_id;
  
  -- NOTE: Cart is NOT cleared here - it will be cleared by webhook when payment is approved
  
  -- Return success with order and payment data
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_order_with_payment_atomic IS 'Atomically creates order with items and initial payment record';

-- ============================================
-- 9. Create RPC function: update_payment_from_webhook
-- ============================================

CREATE OR REPLACE FUNCTION update_payment_from_webhook(
  p_mercadopago_payment_id TEXT,
  p_status TEXT,
  p_payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_payment RECORD;
  v_order_id UUID;
  v_new_order_status TEXT;
  v_user_id UUID;
BEGIN
  -- Find payment by mercadopago_payment_id
  SELECT * INTO v_payment
  FROM payments
  WHERE mercadopago_payment_id = p_mercadopago_payment_id
  LIMIT 1;
  
  -- If not found by payment_id, try to find by preference_id (first webhook call)
  IF NOT FOUND THEN
    -- This might be the first webhook, try to find by preference_id
    -- We'll need to get the external_reference from Mercado Pago API
    -- For now, return error - the API route will handle this
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not found'
    );
  END IF;
  
  v_order_id := v_payment.order_id;
  
  -- Get user_id from order
  SELECT user_id INTO v_user_id
  FROM orders
  WHERE id = v_order_id;
  
  -- Determine new order status based on payment status
  CASE p_status
    WHEN 'approved' THEN
      v_new_order_status := 'processing';
    WHEN 'rejected', 'cancelled', 'refunded' THEN
      v_new_order_status := 'cancelled';
    ELSE
      v_new_order_status := 'pending';
  END CASE;
  
  -- Update payment record
  UPDATE payments
  SET 
    mercadopago_payment_id = p_mercadopago_payment_id,
    status = p_status,
    payment_method = p_payment_method,
    updated_at = NOW()
  WHERE id = v_payment.id;
  
  -- Update order status
  UPDATE orders
  SET 
    status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  -- Clear cart if payment approved
  IF p_status = 'approved' THEN
    DELETE FROM cart_items
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_id', v_order_id,
    'old_status', v_payment.status,
    'new_status', p_status,
    'order_status', v_new_order_status
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_payment_from_webhook IS 'Updates payment and order status from Mercado Pago webhook (idempotent)';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000011_admin_panel_shipping_fields.sql
-- -----------------------------------------------------------------------------

-- Migration: Admin Panel Shipping Fields and Order Status Derivation
-- Description: Adds shipping management fields to orders table and creates
--              centralized order status derivation logic with defensive checks
-- Date: 2025-04-09

-- Add shipping fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered')),
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Create index for shipping status queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Add constraint: tracking_code and carrier required when shipped
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_fields_check;
ALTER TABLE orders 
ADD CONSTRAINT orders_shipping_fields_check 
CHECK (
  (shipping_status IN ('shipped', 'delivered') AND tracking_code IS NOT NULL AND carrier IS NOT NULL)
  OR (shipping_status IN ('pending', 'processing'))
);

-- Create function to derive orders.status from payment + shipping
-- STABLE: depends on database state (payments table)
CREATE OR REPLACE FUNCTION derive_order_status(
  p_payment_status TEXT,
  p_shipping_status TEXT
) RETURNS TEXT AS $$
BEGIN
  -- If payment rejected/cancelled/refunded → cancelled
  IF p_payment_status IN ('rejected', 'cancelled', 'refunded') THEN
    RETURN 'cancelled';
  END IF;
  
  -- If payment pending → pending
  IF p_payment_status = 'pending' THEN
    RETURN 'pending';
  END IF;
  
  -- If payment approved, derive from shipping
  IF p_payment_status = 'approved' THEN
    CASE p_shipping_status
      WHEN 'pending' THEN RETURN 'processing';
      WHEN 'processing' THEN RETURN 'processing';
      WHEN 'shipped' THEN RETURN 'shipped';
      WHEN 'delivered' THEN RETURN 'delivered';
      ELSE RETURN 'processing';
    END CASE;
  END IF;
  
  -- Default
  RETURN 'pending';
END;
$$ LANGUAGE plpgsql STABLE;

-- Create trigger to auto-update orders.status when shipping_status changes
CREATE OR REPLACE FUNCTION update_order_status_on_shipping_change()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_status TEXT;
BEGIN
  -- Get payment status (1:1 relationship enforced by UNIQUE constraint)
  SELECT status INTO v_payment_status
  FROM payments
  WHERE order_id = NEW.id
  LIMIT 1; -- Safety: ensure single result even if constraint not yet applied
  
  -- If no payment found, keep current status
  IF v_payment_status IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Update orders.status based on payment + shipping
  NEW.status := derive_order_status(v_payment_status, NEW.shipping_status);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_status_on_shipping ON orders;
CREATE TRIGGER trigger_update_order_status_on_shipping
  BEFORE UPDATE OF shipping_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_shipping_change();

-- Ensure 1:1 relationship between orders and payments (prevents multiple payments per order)
-- Note: This constraint already exists in payments table (order_id UNIQUE)
-- Verify with: SELECT constraint_name FROM information_schema.table_constraints 
--              WHERE table_name = 'payments' AND constraint_type = 'UNIQUE';

-- Defensive check: Add assertion function to validate 1:1 relationship (optional, for extra safety)
CREATE OR REPLACE FUNCTION assert_single_payment_per_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_payment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_payment_count
  FROM payments
  WHERE order_id = p_order_id;
  
  IF v_payment_count > 1 THEN
    RAISE EXCEPTION 'Data integrity violation: Order % has % payments (expected 1)', 
      p_order_id, v_payment_count;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments
COMMENT ON COLUMN orders.shipping_status IS 'Fulfillment status managed by admin (independent of payment status)';
COMMENT ON COLUMN orders.tracking_code IS 'Tracking code from carrier (required when shipped)';
COMMENT ON COLUMN orders.carrier IS 'Carrier name (free text, e.g., Correios, Jadlog)';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was marked as shipped';
COMMENT ON COLUMN orders.status IS 'Derived summary status (auto-updated by trigger from payment + shipping)';
COMMENT ON FUNCTION derive_order_status IS 'Derives orders.status from payments.status + orders.shipping_status';
COMMENT ON FUNCTION assert_single_payment_per_order IS 'Defensive check: validates 1:1 order-payment relationship. MUST be called in update_payment_from_webhook RPC before updating payment status.';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000012_admin_panel_rls_policies.sql
-- -----------------------------------------------------------------------------

-- Admin Panel RLS Policies
-- Creates Row Level Security policies for admin operations
-- These are the LAST LINE OF DEFENSE - backend validation is primary

-- ============================================
-- PRODUCTS TABLE - Admin Operations
-- ============================================

-- Admin can SELECT all products (including soft-deleted)
DROP POLICY IF EXISTS "admin_select_products" ON products;
CREATE POLICY "admin_select_products"
ON products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can INSERT products
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can UPDATE products
DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products"
ON products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can DELETE products (soft delete via updated_at)
DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products"
ON products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- ORDERS TABLE - Admin Read Access
-- ============================================

-- Admin can SELECT all orders
DROP POLICY IF EXISTS "admin_select_orders" ON orders;
CREATE POLICY "admin_select_orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can UPDATE orders (for shipping info)
DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- ORDER_ITEMS TABLE - Admin Read Access
-- ============================================

-- Admin can SELECT all order items
DROP POLICY IF EXISTS "admin_select_order_items" ON order_items;
CREATE POLICY "admin_select_order_items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- PAYMENTS TABLE - Admin Read Access
-- ============================================

-- Admin can SELECT all payments
DROP POLICY IF EXISTS "admin_select_payments" ON payments;
CREATE POLICY "admin_select_payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "admin_select_products" ON products IS 
'Allows admin users to view all products including soft-deleted ones';

COMMENT ON POLICY "admin_insert_products" ON products IS 
'Allows admin users to create new products';

COMMENT ON POLICY "admin_update_products" ON products IS 
'Allows admin users to update product information and stock';

COMMENT ON POLICY "admin_delete_products" ON products IS 
'Allows admin users to delete products (soft delete)';

COMMENT ON POLICY "admin_select_orders" ON orders IS 
'Allows admin users to view all orders for management';

COMMENT ON POLICY "admin_update_orders" ON orders IS 
'Allows admin users to update shipping information';

COMMENT ON POLICY "admin_select_order_items" ON order_items IS 
'Allows admin users to view order items for order management';

COMMENT ON POLICY "admin_select_payments" ON payments IS 
'Allows admin users to view payment information for orders';


-- -----------------------------------------------------------------------------
-- Migration: 20260405000013_update_webhook_rpc_atomic.sql
-- -----------------------------------------------------------------------------

-- Migration: Update webhook RPC with atomic operations and defensive checks
-- Description: Updates update_payment_from_webhook to use derive_order_status,
--              add defensive checks, and ensure atomic execution
-- Date: 2025-04-09
-- Dependencies: 20250409_admin_panel_shipping_fields.sql (derive_order_status, assert_single_payment_per_order)

CREATE OR REPLACE FUNCTION update_payment_from_webhook(
  p_mercadopago_payment_id TEXT,
  p_status TEXT,
  p_payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_payment RECORD;
  v_order_id UUID;
  v_shipping_status TEXT;
  v_new_order_status TEXT;
  v_user_id UUID;
  v_old_payment_status TEXT;
BEGIN
  -- Find payment by mercadopago_payment_id
  SELECT * INTO v_payment
  FROM payments
  WHERE mercadopago_payment_id = p_mercadopago_payment_id
  LIMIT 1;
  
  -- If not found by payment_id, try to find by preference_id (first webhook call)
  IF NOT FOUND THEN
    -- This might be the first webhook, try to find by preference_id
    -- We'll need to get the external_reference from Mercado Pago API
    -- For now, return error - the API route will handle this
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not found'
    );
  END IF;
  
  v_order_id := v_payment.order_id;
  v_old_payment_status := v_payment.status;
  
  -- CRITICAL: Defensive check - validate 1:1 order-payment relationship
  -- This prevents data corruption if multiple payments exist for same order
  PERFORM assert_single_payment_per_order(v_order_id);
  
  -- Get user_id and shipping_status from order
  SELECT user_id, shipping_status INTO v_user_id, v_shipping_status
  FROM orders
  WHERE id = v_order_id;
  
  -- CRITICAL: Derive order status using centralized function
  -- This ensures consistent status derivation across all code paths
  v_new_order_status := derive_order_status(p_status, v_shipping_status);
  
  -- ATOMIC OPERATIONS (all succeed or all fail together):
  
  -- 1. Update payment record
  UPDATE payments
  SET 
    mercadopago_payment_id = p_mercadopago_payment_id,
    status = p_status,
    payment_method = p_payment_method,
    updated_at = NOW()
  WHERE id = v_payment.id;
  
  -- 2. Update order status (CRITICAL: must happen in same transaction)
  UPDATE orders
  SET 
    status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  -- 3. Clear cart if payment approved
  IF p_status = 'approved' THEN
    DELETE FROM cart_items
    WHERE user_id = v_user_id;
  END IF;
  
  -- Return success with detailed information
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_id', v_order_id,
    'old_payment_status', v_old_payment_status,
    'new_payment_status', p_status,
    'order_status', v_new_order_status,
    'shipping_status', v_shipping_status
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Automatic rollback on any error
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_payment_from_webhook IS 'Updates payment and order status from Mercado Pago webhook (idempotent, atomic). Calls assert_single_payment_per_order for defensive check and derive_order_status for consistent status derivation.';


-- -----------------------------------------------------------------------------
-- Migration: 20260407000001_enable_products_public_access.sql
-- -----------------------------------------------------------------------------

-- Migration: Enable public read access to products table
-- Created: 2026-04-07
-- Purpose: Fix infinite loading on home page by allowing anonymous users to read products

-- Enable Row Level Security on products table
-- This is idempotent - won't fail if RLS is already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (makes migration idempotent)
DROP POLICY IF EXISTS "products_select_public" ON products;

-- Allow public read access to non-deleted products
-- This policy allows SELECT for all users (authenticated and anonymous)
-- Only non-deleted products (deleted_at IS NULL) are accessible
DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  TO public
  USING (deleted_at IS NULL);

-- Note: INSERT/UPDATE/DELETE policies should be added later for admin-only access
-- For now, only SELECT is publicly accessible


-- -----------------------------------------------------------------------------
-- Migration: 20260408000001_optimize_products_query_performance.sql
-- -----------------------------------------------------------------------------

-- ============================================================================
-- MIGRATION: Optimize Products Query Performance
-- ============================================================================
-- 
-- This migration creates indexes to optimize products query performance,
-- specifically addressing cold start timeout issues.
--
-- Indexes created:
-- 1. category_id - for category filtering
-- 2. price - for price range filtering and sorting
-- 3. rating - for rating filtering
-- 4. created_at - for date sorting (latest/oldest)
-- 5. deleted_at - for soft-delete filtering (universal)
-- 6. Full-text search (GIN) - for Portuguese text search on name and description
--
-- All indexes use partial index WHERE deleted_at IS NULL to:
-- - Reduce index size
-- - Improve query performance
-- - Only index active products
--
-- ============================================================================

-- Index 1: category_id for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id) 
WHERE deleted_at IS NULL;

-- Index 2: price for price range filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price) 
WHERE deleted_at IS NULL;

-- Index 3: rating for rating filtering
CREATE INDEX IF NOT EXISTS idx_products_rating 
ON products(rating) 
WHERE deleted_at IS NULL;

-- Index 4: created_at for date sorting (DESC for latest first - most common case)
CREATE INDEX IF NOT EXISTS idx_products_created_at 
ON products(created_at DESC) 
WHERE deleted_at IS NULL;

-- Index 5: deleted_at for soft-delete filtering (universal filter)
CREATE INDEX IF NOT EXISTS idx_products_deleted_at 
ON products(deleted_at) 
WHERE deleted_at IS NULL;

-- Index 6: Full-text search (GIN) for Portuguese text search
-- This index supports to_tsvector('portuguese', name || ' ' || description)
CREATE INDEX IF NOT EXISTS idx_products_fts 
ON products 
USING GIN (to_tsvector('portuguese', name || ' ' || description)) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_index_count INTEGER;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Verifying index creation...';
  RAISE NOTICE '====================================';
  
  -- Count indexes on products table
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes 
  WHERE tablename = 'products' 
  AND indexname IN (
    'idx_products_category_id',
    'idx_products_price',
    'idx_products_rating',
    'idx_products_created_at',
    'idx_products_deleted_at',
    'idx_products_fts'
  );
  
  RAISE NOTICE 'Indexes created: %/6', v_index_count;
  
  IF v_index_count = 6 THEN
    RAISE NOTICE '✅ All indexes created successfully';
  ELSE
    RAISE WARNING '⚠️ Some indexes missing';
  END IF;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '📋 Indexes: category_id, price, rating, created_at, deleted_at, fts';
  RAISE NOTICE '🚀 Query performance should be significantly improved';
  RAISE NOTICE '====================================';
END $$;


-- -----------------------------------------------------------------------------
-- Migration: 20260411000001_fix_product_images_use_generic.sql
-- -----------------------------------------------------------------------------

-- ============================================================================
-- FIX: Atualizar URLs de Imagens de Produtos para Usar Imagens Genéricas
-- ============================================================================
-- 
-- PROBLEMA:
-- - Produtos no banco referenciam imagens específicas que não existem
-- - Causando erros 404 no frontend
-- 
-- SOLUÇÃO:
-- - Mapear produtos para as 6 imagens genéricas existentes:
--   * product-ball.jpg (bola)
--   * product-jersey.jpg (camisa)
--   * product-scarf.jpg (cachecol)
--   * product-shorts.jpg (shorts)
--   * product-cap.jpg (boné)
--   * product-bag.jpg (bolsa)
-- 
-- ESTRATÉGIA:
-- - Todos os produtos de "manto oficial" usam product-jersey.jpg
-- - Produtos futuros de outras categorias usarão imagens apropriadas
-- 
-- ============================================================================

-- Atualizar todos os produtos da categoria "manto-oficial" para usar a imagem genérica de camisa
UPDATE products
SET image_url = '/products/product-jersey.jpg'
WHERE category_id = (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1)
  AND image_url LIKE '/products/%'
  AND image_url NOT IN (
    '/products/product-ball.jpg',
    '/products/product-jersey.jpg',
    '/products/product-scarf.jpg',
    '/products/product-shorts.jpg',
    '/products/product-cap.jpg',
    '/products/product-bag.jpg'
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Mostrar produtos atualizados
SELECT 
  id,
  name,
  image_url,
  category_id
FROM products
WHERE deleted_at IS NULL
ORDER BY name;

-- Contar produtos por imagem
SELECT 
  image_url,
  COUNT(*) as total_produtos
FROM products
WHERE deleted_at IS NULL
GROUP BY image_url
ORDER BY total_produtos DESC;

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- 1. Esta é uma solução temporária usando imagens genéricas
-- 2. Para adicionar imagens específicas dos times no futuro:
--    a. Adicione as imagens em apps/web/public/products/
--    b. Execute UPDATE para produtos específicos:
--       UPDATE products 
--       SET image_url = '/products/flamengo.jpg' 
--       WHERE name = 'Flamengo';
--
-- 3. Imagens genéricas disponíveis:
--    - product-ball.jpg → Para produtos de bola
--    - product-jersey.jpg → Para camisas (usado aqui)
--    - product-scarf.jpg → Para cachecóis
--    - product-shorts.jpg → Para shorts
--    - product-cap.jpg → Para bonés
--    - product-bag.jpg → Para bolsas
--
-- ============================================================================


-- -----------------------------------------------------------------------------
-- Migration: 20260411011309_fix_security_and_performance_part1.sql
-- -----------------------------------------------------------------------------

-- Migration: Fix Security and Performance Issues - Part 1
-- Date: 2026-04-11
-- Description: Fixes function search_path vulnerabilities (6 simple functions)

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: derive_order_status
CREATE OR REPLACE FUNCTION public.derive_order_status(
  p_payment_status TEXT,
  p_shipping_status TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF p_payment_status = 'approved' AND p_shipping_status = 'delivered' THEN
    RETURN 'delivered';
  ELSIF p_payment_status = 'approved' AND p_shipping_status = 'shipped' THEN
    RETURN 'shipped';
  ELSIF p_payment_status = 'approved' AND p_shipping_status = 'processing' THEN
    RETURN 'processing';
  ELSIF p_payment_status = 'cancelled' OR p_payment_status = 'rejected' THEN
    RETURN 'cancelled';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$;

-- Fix: update_order_status_on_shipping_change
CREATE OR REPLACE FUNCTION public.update_order_status_on_shipping_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_payment_status TEXT;
  v_new_status TEXT;
BEGIN
  SELECT p.status INTO v_payment_status
  FROM public.payments p
  WHERE p.order_id = NEW.id;

  v_new_status := public.derive_order_status(v_payment_status, NEW.shipping_status);
  
  IF v_new_status IS DISTINCT FROM NEW.status THEN
    NEW.status := v_new_status;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: assert_single_payment_per_order
CREATE OR REPLACE FUNCTION public.assert_single_payment_per_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.payments
  WHERE order_id = p_order_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Order % already has a payment record', p_order_id;
  END IF;
END;
$$;

-- Fix: check_wishlist_limit
CREATE OR REPLACE FUNCTION public.check_wishlist_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.wishlist_items
  WHERE user_id = NEW.user_id;

  IF v_count >= 20 THEN
    RAISE EXCEPTION 'Wishlist limit of 20 items reached';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: update_orders_updated_at
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;;


-- -----------------------------------------------------------------------------
-- Migration: 20260411011412_fix_security_and_performance_part2.sql
-- -----------------------------------------------------------------------------

-- Migration: Fix Security and Performance Issues - Part 2
-- Date: 2026-04-11
-- Description: Fixes function search_path vulnerabilities (7 complex functions)

-- Fix: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$;

-- Fix: add_to_cart_atomic
CREATE OR REPLACE FUNCTION public.add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_product RECORD;
  v_result RECORD;
BEGIN
  IF p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quantidade deve ser entre 1 e 99'
    );
  END IF;
  
  IF char_length(p_size) < 1 OR char_length(p_size) > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tamanho deve ter entre 1 e 10 caracteres'
    );
  END IF;
  
  SELECT price, name, stock INTO v_product
  FROM public.products
  WHERE id = p_product_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Produto não encontrado'
    );
  END IF;
  
  INSERT INTO public.cart_items (
    user_id,
    product_id,
    quantity,
    size,
    price_snapshot,
    product_name_snapshot
  )
  VALUES (
    p_user_id,
    p_product_id,
    p_quantity,
    p_size,
    v_product.price,
    v_product.name
  )
  ON CONFLICT (user_id, product_id, size)
  DO UPDATE SET
    quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, 99),
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'item', row_to_json(v_result)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;;


-- -----------------------------------------------------------------------------
-- Migration: 20260411011440_fix_security_and_performance_part3.sql
-- -----------------------------------------------------------------------------

-- Migration: Fix Security and Performance Issues - Part 3
-- Date: 2026-04-11
-- Description: Fixes migrate functions

-- Fix: migrate_cart_items
CREATE OR REPLACE FUNCTION public.migrate_cart_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_product RECORD;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name INTO v_product
    FROM public.products
    WHERE id = (v_item->>'productId')::UUID
      AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    
    INSERT INTO public.cart_items (
      user_id,
      product_id,
      quantity,
      size,
      price_snapshot,
      product_name_snapshot
    )
    VALUES (
      p_user_id,
      (v_item->>'productId')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_item->>'size',
      v_product.price,
      v_product.name
    )
    ON CONFLICT (user_id, product_id, size)
    DO UPDATE SET
      quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, 99),
      updated_at = NOW();
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Fix: migrate_wishlist_items
CREATE OR REPLACE FUNCTION public.migrate_wishlist_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_current_count INTEGER;
  v_inserted BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_current_count
  FROM public.wishlist_items
  WHERE user_id = p_user_id;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_current_count >= 20 THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    INSERT INTO public.wishlist_items (user_id, product_id)
    VALUES (p_user_id, (v_item->>'productId')::UUID)
    ON CONFLICT (user_id, product_id) DO NOTHING
    RETURNING true INTO v_inserted;
    
    IF v_inserted THEN
      v_migrated_count := v_migrated_count + 1;
      v_current_count := v_current_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count,
    'skipped_count', v_skipped_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;;


-- -----------------------------------------------------------------------------
-- Migration: 20260411011607_fix_security_and_performance_part4.sql
-- -----------------------------------------------------------------------------

-- Migration: Fix Security and Performance Issues - Part 4
-- Date: 2026-04-11
-- Description: Fixes create_order_atomic function

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
BEGIN
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = p_user_id;
  
  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;
  
  INSERT INTO public.orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0,
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  FOR v_cart_item IN
    SELECT * FROM public.cart_items WHERE user_id = p_user_id
  LOOP
    SELECT id, name, price, stock INTO v_product
    FROM public.products
    WHERE id = v_cart_item.product_id
    AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_cart_item.product_id;
    END IF;
    
    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Product % has insufficient stock', v_product.name;
    END IF;
    
    v_subtotal := v_product.price * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;
    
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;
  
  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;
  
  DELETE FROM public.cart_items WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;;


-- -----------------------------------------------------------------------------
-- Migration: 20260411011741_fix_security_and_performance_part5.sql
-- -----------------------------------------------------------------------------

-- Migration: Fix Security and Performance Issues - Part 5
-- Date: 2026-04-11
-- Description: Fixes create_order_with_payment_atomic and update_payment_from_webhook

-- Fix: create_order_with_payment_atomic
CREATE OR REPLACE FUNCTION public.create_order_with_payment_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT,
  p_mercadopago_preference_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
  v_payment_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = p_user_id;
  
  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;
  
  INSERT INTO public.orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0,
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  FOR v_cart_item IN
    SELECT * FROM public.cart_items WHERE user_id = p_user_id
  LOOP
    SELECT id, name, price, stock INTO v_product
    FROM public.products
    WHERE id = v_cart_item.product_id
    AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_cart_item.product_id;
    END IF;
    
    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Product % has insufficient stock (available: %, requested: %)',
        v_product.name, v_product.stock, v_cart_item.quantity;
    END IF;
    
    v_subtotal := v_product.price * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;
    
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;
  
  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;
  
  INSERT INTO public.payments (
    order_id,
    mercadopago_preference_id,
    status,
    amount
  )
  VALUES (
    v_order_id,
    p_mercadopago_preference_id,
    'pending',
    v_total_amount
  )
  RETURNING id INTO v_payment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;;


-- -----------------------------------------------------------------------------
-- Migration: 20260411011826_fix_security_and_performance_part6.sql
-- -----------------------------------------------------------------------------

-- Migration: Fix Security and Performance Issues - Part 6
-- Date: 2026-04-11
-- Description: Fixes update_payment_from_webhook function

CREATE OR REPLACE FUNCTION public.update_payment_from_webhook(
  p_mercadopago_payment_id TEXT,
  p_status TEXT,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment RECORD;
  v_order_id UUID;
  v_shipping_status TEXT;
  v_new_order_status TEXT;
  v_user_id UUID;
  v_old_payment_status TEXT;
BEGIN
  SELECT * INTO v_payment
  FROM public.payments
  WHERE mercadopago_payment_id = p_mercadopago_payment_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not found'
    );
  END IF;
  
  v_order_id := v_payment.order_id;
  v_old_payment_status := v_payment.status;
  
  PERFORM public.assert_single_payment_per_order(v_order_id);
  
  SELECT user_id, shipping_status INTO v_user_id, v_shipping_status
  FROM public.orders
  WHERE id = v_order_id;
  
  v_new_order_status := public.derive_order_status(p_status, v_shipping_status);
  
  UPDATE public.payments
  SET 
    mercadopago_payment_id = p_mercadopago_payment_id,
    status = p_status,
    payment_method = p_payment_method,
    updated_at = NOW()
  WHERE id = v_payment.id;
  
  UPDATE public.orders
  SET 
    status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  IF p_status = 'approved' THEN
    DELETE FROM public.cart_items
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_id', v_order_id,
    'old_payment_status', v_old_payment_status,
    'new_payment_status', p_status,
    'order_status', v_new_order_status,
    'shipping_status', v_shipping_status
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$$;;


-- -----------------------------------------------------------------------------
-- Migration: 20260411011908_optimize_rls_policies_profiles.sql
-- -----------------------------------------------------------------------------

-- Migration: Optimize RLS Policies - Profiles
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for profiles table and consolidates duplicate policies

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update" ON public.profiles;

-- Create optimized consolidated policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));;


-- -----------------------------------------------------------------------------
-- Migration: 20260411011952_optimize_rls_policies_addresses.sql
-- -----------------------------------------------------------------------------

-- Migration: Optimize RLS Policies - Addresses
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for addresses table

DROP POLICY IF EXISTS "Users can read own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;

DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
CREATE POLICY "addresses_select_own"
  ON public.addresses
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
CREATE POLICY "addresses_insert_own"
  ON public.addresses
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own"
  ON public.addresses
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own"
  ON public.addresses
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));;


-- -----------------------------------------------------------------------------
-- Migration: 20260411012008_optimize_rls_policies_cart_wishlist.sql
-- -----------------------------------------------------------------------------

-- Migration: Optimize RLS Policies - Cart and Wishlist
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for cart_items and wishlist_items tables

-- Cart Items
DROP POLICY IF EXISTS "cart_items_select_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_insert_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_update_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_delete_own" ON public.cart_items;

DROP POLICY IF EXISTS "cart_items_select_own" ON public.cart_items;
CREATE POLICY "cart_items_select_own"
  ON public.cart_items
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cart_items_insert_own" ON public.cart_items;
CREATE POLICY "cart_items_insert_own"
  ON public.cart_items
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cart_items_update_own" ON public.cart_items;
CREATE POLICY "cart_items_update_own"
  ON public.cart_items
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cart_items_delete_own" ON public.cart_items;
CREATE POLICY "cart_items_delete_own"
  ON public.cart_items
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Wishlist Items
DROP POLICY IF EXISTS "wishlist_items_select_own" ON public.wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_insert_own" ON public.wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_delete_own" ON public.wishlist_items;

DROP POLICY IF EXISTS "wishlist_items_select_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_select_own"
  ON public.wishlist_items
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wishlist_items_insert_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_insert_own"
  ON public.wishlist_items
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wishlist_items_delete_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_delete_own"
  ON public.wishlist_items
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));;


-- -----------------------------------------------------------------------------
-- Migration: 20260411012029_optimize_rls_policies_orders.sql
-- -----------------------------------------------------------------------------

-- Migration: Optimize RLS Policies - Orders and Order Items
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for orders and order_items tables

-- Orders
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own"
  ON public.orders
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own"
  ON public.orders
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
CREATE POLICY "orders_update_own_or_admin"
  ON public.orders
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid()) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin"
  ON public.orders
  FOR DELETE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Order Items
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
CREATE POLICY "order_items_select_own"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
CREATE POLICY "order_items_insert_own"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
CREATE POLICY "order_items_update_admin"
  ON public.order_items
  FOR UPDATE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;
CREATE POLICY "order_items_delete_admin"
  ON public.order_items
  FOR DELETE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );;


-- -----------------------------------------------------------------------------
-- Migration: 20260411012053_optimize_rls_policies_payments.sql
-- -----------------------------------------------------------------------------

-- Migration: Optimize RLS Policies - Payments
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for payments table

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
DROP POLICY IF EXISTS "payments_update_system_or_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "payments_update_system_or_admin" ON public.payments;
CREATE POLICY "payments_update_system_or_admin"
  ON public.payments
  FOR UPDATE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;
CREATE POLICY "payments_delete_admin"
  ON public.payments
  FOR DELETE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );;


-- -----------------------------------------------------------------------------
-- Migration: 20260411013000_align_admin_rls_with_profiles.sql
-- -----------------------------------------------------------------------------

-- Migration: Align admin RLS checks with profiles.role and metadata role
-- Date: 2026-04-11
-- Description: Prevent admin-panel regressions by supporting both role sources

-- Orders
DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
CREATE POLICY "orders_update_own_or_admin"
  ON public.orders
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin"
  ON public.orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Order Items
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
CREATE POLICY "order_items_update_admin"
  ON public.order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;
CREATE POLICY "order_items_delete_admin"
  ON public.order_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Payments
DROP POLICY IF EXISTS "payments_update_system_or_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

DROP POLICY IF EXISTS "payments_update_system_or_admin" ON public.payments;
CREATE POLICY "payments_update_system_or_admin"
  ON public.payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;
CREATE POLICY "payments_delete_admin"
  ON public.payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );



-- -----------------------------------------------------------------------------
-- Migration: 20260411060000_add_admin_select_orders_policy.sql
-- -----------------------------------------------------------------------------

-- Migration: Add admin SELECT policy for orders
-- Date: 2026-04-11
-- Description: Allow admins to view ALL orders, not just their own

-- ============================================================================
-- PROBLEMA IDENTIFICADO:
-- ============================================================================
-- A política "orders_select_own" limita a leitura de pedidos apenas aos
-- pedidos do próprio usuário. Isso faz com que o painel admin mostre apenas
-- os pedidos do admin logado, ao invés de TODOS os pedidos do sistema.
--
-- SOLUÇÃO:
-- Adicionar política de SELECT para admins que permite visualizar todos os pedidos.
-- ============================================================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;

-- Create new SELECT policy that allows:
-- 1. Users to see their own orders
-- 2. Admins to see ALL orders
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders
  FOR SELECT
  USING (
    -- User can see their own orders
    user_id = (SELECT auth.uid())
    OR
    -- Admin can see ALL orders (check profiles.role)
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Admin can see ALL orders (check auth.users metadata)
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Para verificar se a política está funcionando, execute:
--
-- 1. Como usuário normal (deve ver apenas seus pedidos):
-- SELECT * FROM orders WHERE user_id = auth.uid();
--
-- 2. Como admin (deve ver TODOS os pedidos):
-- SELECT * FROM orders;
--
-- 3. Verificar políticas ativas:
-- SELECT * FROM pg_policies WHERE tablename = 'orders' AND policyname LIKE '%select%';
-- ============================================================================

-- ============================================================================
-- POLÍTICAS RELACIONADAS (order_items e payments)
-- ============================================================================
-- Também precisamos garantir que admins possam ver order_items e payments

-- Order Items - SELECT policy for admin
DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_or_admin"
  ON public.order_items
  FOR SELECT
  USING (
    -- User can see items from their own orders
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
    OR
    -- Admin can see ALL order items
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Payments - SELECT policy for admin
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;

DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;
CREATE POLICY "payments_select_own_or_admin"
  ON public.payments
  FOR SELECT
  USING (
    -- User can see payments from their own orders
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
    OR
    -- Admin can see ALL payments
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- ============================================================================
-- RESUMO DAS MUDANÇAS
-- ============================================================================
-- ✅ orders: Admin pode ver TODOS os pedidos
-- ✅ order_items: Admin pode ver TODOS os itens de pedidos
-- ✅ payments: Admin pode ver TODOS os pagamentos
--
-- Usuários normais continuam vendo apenas seus próprios dados.
-- ============================================================================


-- -----------------------------------------------------------------------------
-- Migration: 20260413000001_add_unlimited_stock_to_products.sql
-- -----------------------------------------------------------------------------

-- Migration: Add unlimited_stock column to products table
-- Purpose: Support dropshipping model where the supplier manages inventory.
-- When unlimited_stock = true, the stock field is ignored for availability checks.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unlimited_stock boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN products.unlimited_stock IS
  'When true, the product is fulfilled by a supplier (dropshipping) and the stock field is ignored for availability. Managed via admin panel.';


-- -----------------------------------------------------------------------------
-- Migration: 20260415000001_fix_checkout_product_lookup.sql
-- -----------------------------------------------------------------------------

-- Migration: Fix checkout product lookup to use cart snapshots
-- Date: 2026-04-15
-- Description:
--   1. Both RPCs previously queried products with `AND deleted_at IS NULL`,
--      causing "Product not found" errors for any soft-deleted product still in cart.
--      Fix: use price_snapshot and product_name_snapshot from cart_items (already
--      captured at add-to-cart time) and only query products for stock validation.
--   2. create_order_with_payment_atomic was missing the cart cleanup step.
--      Fix: add DELETE FROM cart_items after processing order items.

-- ─── Fix: create_order_with_payment_atomic ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_order_with_payment_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT,
  p_mercadopago_preference_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product_stock INTEGER;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
  v_payment_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = p_user_id;

  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;

  INSERT INTO public.orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0,
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;

  FOR v_cart_item IN
    SELECT * FROM public.cart_items WHERE user_id = p_user_id
  LOOP
    -- Query product only for stock validation (no deleted_at filter).
    -- Price and name come from the snapshot stored at add-to-cart time.
    SELECT stock INTO v_product_stock
    FROM public.products
    WHERE id = v_cart_item.product_id;

    IF FOUND THEN
      -- Product still exists: validate stock availability
      IF v_product_stock < v_cart_item.quantity THEN
        RAISE EXCEPTION 'Produto "%" sem estoque suficiente (disponível: %, solicitado: %)',
          v_cart_item.product_name_snapshot, v_product_stock, v_cart_item.quantity;
      END IF;
    END IF;
    -- If NOT FOUND the product was soft-deleted after being added to cart;
    -- allow checkout using snapshot data (no stock check needed).

    v_subtotal := v_cart_item.price_snapshot * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.product_name_snapshot,
      v_cart_item.price_snapshot,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;

  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;

  -- Clear cart (was missing in the previous version of this RPC)
  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  INSERT INTO public.payments (
    order_id,
    mercadopago_preference_id,
    status,
    amount
  )
  VALUES (
    v_order_id,
    p_mercadopago_preference_id,
    'pending',
    v_total_amount
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ─── Fix: create_order_atomic (fallback RPC) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product_stock INTEGER;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
BEGIN
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = p_user_id;

  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;

  INSERT INTO public.orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0,
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;

  FOR v_cart_item IN
    SELECT * FROM public.cart_items WHERE user_id = p_user_id
  LOOP
    -- Query product only for stock validation (no deleted_at filter).
    -- Price and name come from the snapshot stored at add-to-cart time.
    SELECT stock INTO v_product_stock
    FROM public.products
    WHERE id = v_cart_item.product_id;

    IF FOUND THEN
      -- Product still exists: validate stock availability
      IF v_product_stock < v_cart_item.quantity THEN
        RAISE EXCEPTION 'Produto "%" sem estoque suficiente (disponível: %, solicitado: %)',
          v_cart_item.product_name_snapshot, v_product_stock, v_cart_item.quantity;
      END IF;
    END IF;
    -- If NOT FOUND the product was soft-deleted after being added to cart;
    -- allow checkout using snapshot data (no stock check needed).

    v_subtotal := v_cart_item.price_snapshot * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.product_name_snapshot,
      v_cart_item.price_snapshot,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;

  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;

  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.create_order_with_payment_atomic IS
  'Atomically creates an order with items, clears the cart, and creates a pending payment record. Uses price_snapshot/product_name_snapshot from cart_items; only queries products table for stock validation.';

COMMENT ON FUNCTION public.create_order_atomic IS
  'Fallback: atomically creates an order with items and clears the cart (payment record created separately). Uses price_snapshot/product_name_snapshot from cart_items; only queries products table for stock validation.';


-- -----------------------------------------------------------------------------
-- Migration: 20260421000001_seed_admin_caiu.sql
-- -----------------------------------------------------------------------------

-- Migration: Promove caiu.lfc@gmail.com a admin (idempotente)
-- Date: 2026-04-21
-- Description: Backfill de profile (caso o trigger on_auth_user_created não
-- estivesse ativo quando o usuário se cadastrou) + promoção a admin.
-- Segurança: usa SELECT em auth.users; só faz efeito se o email já existir.
-- Se o usuário ainda não se cadastrou, a migration vira no-op e pode ser
-- re-executada após o signup sem problemas (ON CONFLICT / WHERE).

-- ============================================================================
-- 1. Backfill do profile (se já havia usuário mas não havia profile)
-- ============================================================================

INSERT INTO public.profiles (id, email, name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.email = 'caiu.lfc@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Promoção a admin em profiles.role
-- ============================================================================

UPDATE public.profiles
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'caiu.lfc@gmail.com'
  AND role <> 'admin';

-- ============================================================================
-- 3. Também sincroniza em auth.users.raw_user_meta_data.role
-- ============================================================================
-- O middleware checa tanto profiles.role quanto user_metadata.role
-- (lib/auth/roles.ts). Manter os dois em sincronia evita confusão.

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'caiu.lfc@gmail.com'
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin';


COMMIT;

-- =============================================================================
-- Após rodar este arquivo:
--   SELECT count(*) FROM public.products WHERE deleted_at IS NULL;
--   SELECT name, deleted_at FROM public.products ORDER BY name LIMIT 5;
-- =============================================================================
