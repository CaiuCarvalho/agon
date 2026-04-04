-- Product Catalog CRUD Database Schema Migration
-- Execute this script in the Supabase SQL Editor
-- https://supabase.com/dashboard/project/[your-project-id]/sql/new

-- This migration creates the database schema for the Product Catalog CRUD feature
-- including categories and products tables with RLS policies, indexes, and seed data

-- ============================================================================
-- 1. CATEGORIES TABLE
-- ============================================================================

-- Create categories table for product organization
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) > 0 AND char_length(slug) <= 100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for slug-based lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "categories_select_public" ON categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
DROP POLICY IF EXISTS "categories_update_admin" ON categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

-- RLS Policy: Public read access
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

-- RLS Policy: Admin insert access
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Admin update access
CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Admin delete access
CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp (reuse existing function)
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. PRODUCTS TABLE
-- ============================================================================

-- Create products table with soft delete support
CREATE TABLE IF NOT EXISTS products (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector('portuguese', description));

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "products_select_public" ON products;
DROP POLICY IF EXISTS "products_insert_admin" ON products;
DROP POLICY IF EXISTS "products_update_admin" ON products;
DROP POLICY IF EXISTS "products_delete_admin" ON products;

-- RLS Policy: Public read access (customers) - only non-deleted products
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (deleted_at IS NULL);

-- RLS Policy: Admin insert access
CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Admin update access
CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Admin delete access
CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp (reuse existing function)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. SEED DATA - DEFAULT CATEGORIES
-- ============================================================================

-- Insert default categories (use ON CONFLICT to allow re-running this script)
INSERT INTO categories (name, slug, description) VALUES
  ('Manto Oficial', 'manto-oficial', 'Camisas oficiais da Seleção Brasileira'),
  ('Equipamentos', 'equipamentos', 'Equipamentos esportivos e acessórios de treino'),
  ('Lifestyle', 'lifestyle', 'Produtos casuais e de estilo de vida'),
  ('Cuidados', 'cuidados', 'Produtos de cuidados pessoais e bem-estar')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 4. ADD FOREIGN KEY TO ORDER_ITEMS (if order_items table exists)
-- ============================================================================

-- This adds the foreign key constraint to order_items.product_id if the table exists
-- If order_items doesn't exist yet, this will be skipped
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
    
    -- Add foreign key constraint
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES products(id)
      ON DELETE RESTRICT;
    
    RAISE NOTICE 'Foreign key constraint added to order_items.product_id';
  ELSE
    RAISE NOTICE 'order_items table does not exist yet, skipping foreign key constraint';
  END IF;
END
$;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('categories', 'products')
ORDER BY table_name;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('categories', 'products')
ORDER BY tablename;

-- Verify policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('categories', 'products')
ORDER BY tablename, policyname;

-- Verify indexes exist
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('categories', 'products')
ORDER BY tablename, indexname;

-- Verify seed data was inserted
SELECT 
  id,
  name,
  slug,
  created_at
FROM categories
ORDER BY name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- You can now use these tables in your application.
-- Remember to:
-- 1. Test RLS policies by attempting cross-user access
-- 2. Verify triggers are working by updating records and checking updated_at timestamps
-- 3. Test full-text search with Portuguese language support
-- 4. Verify soft delete functionality (deleted_at column)
-- 5. Test foreign key constraints (category deletion with products should fail)
