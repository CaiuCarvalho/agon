# User Profile Page Database Migration Guide

This guide explains how to set up the database schema for the User Profile Page feature in your Supabase project.

## Overview

The migration creates four main tables:
- **profiles**: User profile information (name, avatar, phone, CPF, role)
- **addresses**: User delivery addresses (up to 5 per user, one default)
- **orders**: Order records with status tracking
- **order_items**: Individual items within each order

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## Prerequisites

- Access to your Supabase project dashboard
- SQL Editor access in Supabase
- Basic understanding of PostgreSQL

## Migration Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration Script

1. Open the file `supabase-user-profile-schema.sql` in your code editor
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 3: Verify the Migration

After running the script, you should see verification queries at the bottom that show:

1. **Tables Created**: Confirms all 4 tables were created with their columns
2. **RLS Enabled**: Confirms Row Level Security is enabled on all tables
3. **Policies Created**: Lists all security policies for each table

Expected output:
```
table_name    | column_count
--------------+-------------
addresses     | 11
order_items   | 7
orders        | 9
profiles      | 8
```

## Schema Details

### Profiles Table

Stores user profile information linked to Supabase Auth users.

**Columns:**
- `id` (UUID, PK): References auth.users(id)
- `name` (TEXT): User's full name
- `email` (TEXT): User's email address
- `avatar_url` (TEXT): URL to user's avatar image
- `phone` (TEXT): Brazilian phone number (10-11 digits)
- `tax_id` (TEXT): CPF (11 digits)
- `role` (TEXT): User role (default: 'customer')
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**RLS Policies:**
- Users can read their own profile
- Users can update their own profile

### Addresses Table

Stores delivery addresses for users (max 5 per user).

**Columns:**
- `id` (UUID, PK): Unique address identifier
- `user_id` (UUID, FK): References auth.users(id)
- `zip_code` (TEXT): 8-digit Brazilian CEP
- `street` (TEXT): Street name
- `number` (TEXT): Street number
- `complement` (TEXT, optional): Apartment, suite, etc.
- `neighborhood` (TEXT): Neighborhood/district
- `city` (TEXT): City name
- `state` (TEXT): 2-character state code
- `is_default` (BOOLEAN): Whether this is the default address
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**Constraints:**
- Only one address per user can have `is_default = TRUE` (enforced by unique index)

**RLS Policies:**
- Users can read, create, update, and delete their own addresses

### Orders Table

Stores order records with status tracking.

**Columns:**
- `id` (UUID, PK): Unique order identifier
- `user_id` (UUID, FK): References auth.users(id)
- `status` (TEXT): Order status (PENDING, PAID, FAILED, SHIPPED, DELIVERED, CANCELLED)
- `total` (DECIMAL): Order total amount (must be >= 0)
- `payment_method` (TEXT): Payment method used
- `shipping_address_id` (UUID, FK): References addresses(id)
- `tracking_code` (TEXT): Shipping tracking code
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**Constraints:**
- `status` must be one of: PENDING, PAID, FAILED, SHIPPED, DELIVERED, CANCELLED
- `total` must be >= 0

**RLS Policies:**
- Users can read their own orders (read-only, no create/update/delete)

### Order Items Table

Stores individual items within each order.

**Columns:**
- `id` (UUID, PK): Unique item identifier
- `order_id` (UUID, FK): References orders(id)
- `product_id` (UUID): Product identifier (FK to products table when created)
- `quantity` (INTEGER): Quantity ordered (must be > 0)
- `unit_price` (DECIMAL): Price per unit (must be >= 0)
- `size` (TEXT, optional): Product size/variant
- `created_at` (TIMESTAMPTZ): Timestamp

**Constraints:**
- `quantity` must be > 0
- `unit_price` must be >= 0

**RLS Policies:**
- Users can read items from their own orders

## Important Notes

### Products Table

The `order_items` table references a `product_id` field, but **does not enforce a foreign key constraint** to a products table. This is intentional to allow flexibility in your schema.

**If you have a products table:**
You can add the foreign key constraint manually:

```sql
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_product_id
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
```

**If you don't have a products table yet:**
The migration will work fine without it. You can create the products table later and add the constraint then.

### Re-running the Migration

The migration script is **idempotent**, meaning you can run it multiple times safely. It uses:
- `CREATE TABLE IF NOT EXISTS` to avoid errors if tables already exist
- `DROP POLICY IF EXISTS` before creating policies to allow updates
- `DROP TRIGGER IF EXISTS` before creating triggers

However, **existing data will not be deleted** when re-running the script.

### Automatic Timestamps

The migration includes triggers that automatically update the `updated_at` timestamp whenever a record is modified in the `profiles`, `addresses`, or `orders` tables.

## Testing the Migration

### Test RLS Policies

To verify RLS policies are working correctly:

1. Create a test user (use `supabase-create-test-user.sql` if available)
2. Try to query another user's data:

```sql
-- This should return only the current user's profile
SELECT * FROM profiles WHERE id = auth.uid();

-- This should return empty (cannot access other users' data)
SELECT * FROM profiles WHERE id != auth.uid();
```

### Test Default Address Constraint

To verify only one default address per user:

```sql
-- Insert first default address (should succeed)
INSERT INTO addresses (user_id, zip_code, street, number, neighborhood, city, state, is_default)
VALUES (auth.uid(), '12345678', 'Rua Teste', '123', 'Centro', 'São Paulo', 'SP', TRUE);

-- Try to insert second default address (should fail with unique constraint violation)
INSERT INTO addresses (user_id, zip_code, street, number, neighborhood, city, state, is_default)
VALUES (auth.uid(), '87654321', 'Rua Teste 2', '456', 'Centro', 'São Paulo', 'SP', TRUE);
```

### Test Order Status Constraint

To verify order status validation:

```sql
-- This should succeed
INSERT INTO orders (user_id, status, total)
VALUES (auth.uid(), 'PENDING', 100.00);

-- This should fail (invalid status)
INSERT INTO orders (user_id, status, total)
VALUES (auth.uid(), 'INVALID_STATUS', 100.00);
```

## Rollback

If you need to remove the tables and start over:

```sql
-- WARNING: This will delete all data in these tables!
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Next Steps

After running the migration:

1. ✅ Verify all tables were created successfully
2. ✅ Test RLS policies with a test user
3. ✅ Create a products table if needed
4. ✅ Start implementing the User Profile Page components
5. ✅ Run property-based tests to verify database constraints

## Troubleshooting

### Error: "relation already exists"

If you see this error, it means the table already exists. The migration uses `IF NOT EXISTS` clauses, so this shouldn't happen. If it does, you may have a conflicting table definition.

**Solution:** Check your existing schema and either drop the conflicting table or modify the migration to match your existing structure.

### Error: "permission denied for schema public"

This means your database user doesn't have permission to create tables.

**Solution:** Ensure you're running the migration as a superuser or a user with CREATE privileges on the public schema.

### Error: "function gen_random_uuid() does not exist"

This means the `pgcrypto` extension is not enabled.

**Solution:** Run this before the migration:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

(Supabase projects should have this enabled by default)

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your database user has the correct permissions
3. Review the verification queries output to see what was created
4. Check the RLS policies are correctly applied

For more information, see:
- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Constraints Documentation](https://www.postgresql.org/docs/current/ddl-constraints.html)
