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
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

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
CREATE POLICY "Users can read own addresses"
  ON public.addresses FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own addresses" ON public.addresses;
CREATE POLICY "Users can create own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses"
  ON public.addresses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  USING (user_id = auth.uid());
