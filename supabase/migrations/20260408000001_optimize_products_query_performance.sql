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
