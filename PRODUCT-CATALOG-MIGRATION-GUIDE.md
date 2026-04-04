# Product Catalog Database Migration Guide

## Overview

This guide explains how to apply the Product Catalog CRUD database schema to your Supabase project.

## Migration File

The migration SQL file has been created: `supabase-product-catalog-schema.sql`

## What This Migration Creates

### 1. Categories Table
- Stores product categories (Manto Oficial, Equipamentos, Lifestyle, Cuidados)
- Includes unique constraints on `name` and `slug`
- RLS policies: public read, admin write

### 2. Products Table
- Stores all product data with soft delete support (`deleted_at` column)
- Foreign key to categories table
- CHECK constraints for data validation (price >= 0, stock >= 0, rating 0-5)
- Full-text search indexes using PostgreSQL's `to_tsvector` with Portuguese language support
- Performance indexes on category_id, deleted_at, created_at, price
- RLS policies: public read (non-deleted only), admin write

### 3. Seed Data
- Inserts 4 default categories with Portuguese names and descriptions

### 4. Foreign Key Update (Optional)
- Adds foreign key constraint to `order_items.product_id` if the table exists

## How to Apply the Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/yyhpqecnxkvtnjdqhwhk/sql/new

2. Copy the entire contents of `supabase-product-catalog-schema.sql`

3. Paste into the SQL Editor

4. Click "Run" to execute the migration

5. Verify the results in the output panel

### Option 2: Supabase CLI (If Installed)

```bash
# If you have Supabase CLI installed
supabase db push
```

## Verification Steps

After running the migration, verify the following:

### 1. Check Tables Were Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'products');
```

Expected result: 2 rows (categories, products)

### 2. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'products');
```

Expected result: Both tables should have `rowsecurity = true`

### 3. Check Seed Data

```sql
SELECT name, slug FROM categories ORDER BY name;
```

Expected result: 4 categories (Cuidados, Equipamentos, Lifestyle, Manto Oficial)

### 4. Check Indexes

```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'products'
ORDER BY indexname;
```

Expected result: Multiple indexes including full-text search indexes

## Testing RLS Policies

### Test Public Read Access (Should Work)

```sql
-- This should return all non-deleted products
SELECT * FROM products WHERE deleted_at IS NULL;
```

### Test Admin Write Access (Requires Admin Role)

```sql
-- This will only work if you're authenticated as an admin user
INSERT INTO categories (name, slug, description) 
VALUES ('Test Category', 'test-category', 'Test description');
```

## Important Notes

1. **Full-Text Search**: The migration uses PostgreSQL's `to_tsvector('portuguese', name)` for full-text search, NOT ILIKE. This provides better performance and language-specific search capabilities.

2. **Soft Delete**: Products are never physically deleted. The `deleted_at` column is set to mark products as deleted, preserving historical data for orders.

3. **RLS Policies**: The policies reference `profiles.role = 'admin'`. Make sure your admin users have `role = 'admin'` in the profiles table.

4. **Category Protection**: Categories cannot be deleted if they have associated products (ON DELETE RESTRICT).

5. **Partial Index**: The `deleted_at` index is a partial index (WHERE deleted_at IS NULL) for optimal performance on active products.

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop tables (this will also drop all data!)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Note: This will NOT drop the update_updated_at_column() function
-- as it's shared with other tables
```

## Next Steps

After applying the migration:

1. ✅ Verify all tables and indexes were created
2. ✅ Test RLS policies with admin and non-admin users
3. ✅ Verify seed categories were inserted
4. ✅ Test full-text search functionality
5. ✅ Proceed to implement the frontend components

## Troubleshooting

### Error: "function update_updated_at_column() does not exist"

This function should already exist from the user profile migration. If not, add this before the triggers:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

### Error: "relation 'profiles' does not exist"

The RLS policies reference the `profiles` table. Make sure you've run the user profile migration first.

### Error: "duplicate key value violates unique constraint"

If you're re-running the migration, the seed data insert uses `ON CONFLICT DO NOTHING` to prevent duplicates. This is expected behavior.

## Support

If you encounter any issues:
1. Check the Supabase logs in the Dashboard
2. Verify your admin user has `role = 'admin'` in the profiles table
3. Ensure the profiles table exists before running this migration
