# Apply Products Query Performance Migration

This migration creates indexes to optimize products query performance and fix cold start timeout issues.

## What This Migration Does

Creates 6 indexes on the `products` table:

1. **idx_products_category_id** - Optimizes category filtering
2. **idx_products_price** - Optimizes price range filtering and sorting
3. **idx_products_rating** - Optimizes rating filtering
4. **idx_products_created_at** - Optimizes date sorting (latest/oldest)
5. **idx_products_deleted_at** - Optimizes soft-delete filtering (universal)
6. **idx_products_fts** - Full-text search (GIN) for Portuguese text search

All indexes use partial index `WHERE deleted_at IS NULL` to:
- Reduce index size
- Improve query performance
- Only index active products

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `supabase/migrations/20260408000001_optimize_products_query_performance.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**
7. Verify the output shows "✅ MIGRATION COMPLETE!"

### Option 2: Supabase CLI

```bash
# From project root
supabase db push
```

## Verification

After applying the migration, verify indexes were created:

```sql
-- Check indexes on products table
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'products' 
AND indexname LIKE 'idx_products_%';
```

You should see 6 indexes:
- idx_products_category_id
- idx_products_price
- idx_products_rating
- idx_products_created_at
- idx_products_deleted_at
- idx_products_fts

## Expected Performance Improvement

**Before Migration:**
- Cold start queries: > 10 seconds (timeout)
- Warm queries: 2-5 seconds
- EXPLAIN ANALYZE shows: Sequential Scans

**After Migration:**
- Cold start queries: < 2 seconds ✅
- Warm queries: < 1 second ✅
- EXPLAIN ANALYZE shows: Index Scans ✅

## Testing

Run the test suite to verify the fix:

```bash
# From apps/web directory
npm test -- src/__tests__/products-query-timeout.bugcondition.test.ts
npm test -- src/__tests__/products-query-timeout.preservation.test.ts
```

All tests should pass.

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop all indexes created by this migration
DROP INDEX IF EXISTS idx_products_category_id;
DROP INDEX IF EXISTS idx_products_price;
DROP INDEX IF EXISTS idx_products_rating;
DROP INDEX IF EXISTS idx_products_created_at;
DROP INDEX IF EXISTS idx_products_deleted_at;
DROP INDEX IF EXISTS idx_products_fts;
```

## Notes

- This migration is **idempotent** - you can run it multiple times safely
- Indexes are created with `IF NOT EXISTS` to prevent errors on re-run
- All indexes use partial index `WHERE deleted_at IS NULL` for efficiency
- The GIN index for full-text search supports Portuguese language stemming
