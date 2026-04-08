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
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  TO public
  USING (deleted_at IS NULL);

-- Note: INSERT/UPDATE/DELETE policies should be added later for admin-only access
-- For now, only SELECT is publicly accessible
