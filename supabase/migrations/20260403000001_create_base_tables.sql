-- =============================================================================
-- Migration: Create base tables
-- Date: 2026-04-03
-- Description: Creates categories, products, profiles, and addresses tables.
--   These tables were originally created via the Supabase Dashboard and were
--   never added to version-controlled migrations. This migration allows a fresh
--   project to be fully initialized from migrations alone.
--
--   Dependency order (all later migrations rely on these tables):
--     categories → products → cart_items / wishlist_items / order_items
--     auth.users → profiles / addresses / cart_items / orders
-- =============================================================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CATEGORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories (needed for product listing)
CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  TO public
  USING (true);

-- =============================================================================
-- 2. PRODUCTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT           NOT NULL,
  description TEXT           NOT NULL DEFAULT '',
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID           REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url   TEXT           NOT NULL DEFAULT '',
  stock       INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  features    TEXT[]         NOT NULL DEFAULT '{}',
  rating      DECIMAL(3, 1)  NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews     INTEGER        NOT NULL DEFAULT 0 CHECK (reviews >= 0),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
  -- unlimited_stock column added later by 20260413000001_add_unlimited_stock_to_products.sql
);

-- RLS and public SELECT policy added by 20260407000001_enable_products_public_access.sql
-- Admin policies added by 20260409000003_admin_panel_rls_policies.sql

-- =============================================================================
-- 3. PROFILES  (extends auth.users — one row per user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  role        TEXT        NOT NULL DEFAULT 'customer',
  avatar_url  TEXT,
  tax_id      TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies (dropped and replaced by 20260411011908_optimize_rls_policies_profiles.sql)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Trigger: automatically create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 4. ADDRESSES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zip_code     TEXT        NOT NULL,
  street       TEXT        NOT NULL,
  number       TEXT        NOT NULL,
  complement   TEXT,
  neighborhood TEXT        NOT NULL,
  city         TEXT        NOT NULL,
  state        TEXT        NOT NULL CHECK (char_length(state) = 2),
  is_default   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Basic policies (dropped and replaced by 20260411011952_optimize_rls_policies_addresses.sql)
CREATE POLICY "Users can read own addresses"
  ON public.addresses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
  ON public.addresses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  USING (user_id = auth.uid());
