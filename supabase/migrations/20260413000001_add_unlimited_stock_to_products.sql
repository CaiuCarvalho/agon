-- Migration: Add unlimited_stock column to products table
-- Purpose: Support dropshipping model where the supplier manages inventory.
-- When unlimited_stock = true, the stock field is ignored for availability checks.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unlimited_stock boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN products.unlimited_stock IS
  'When true, the product is fulfilled by a supplier (dropshipping) and the stock field is ignored for availability. Managed via admin panel.';
