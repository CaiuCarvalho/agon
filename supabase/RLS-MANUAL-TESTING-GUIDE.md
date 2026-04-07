# RLS Manual Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing Row Level Security (RLS) policies on the `cart_items` and `wishlist_items` tables. The goal is to validate that:

1. Users can only access their own data
2. There is no data leakage between users
3. All CRUD operations (SELECT, INSERT, UPDATE, DELETE) respect RLS policies

## Prerequisites

- Access to Supabase Dashboard
- Two test user accounts (we'll create these)
- Basic understanding of SQL queries

---

## Part 1: Create Two Test Users

### Option A: Using Supabase Dashboard

1. **Navigate to Authentication**
   - Open your Supabase project dashboard
   - Go to **Authentication** → **Users**

2. **Create Test User 1**
   - Click **Add user** → **Create new user**
   - Email: `testuser1@example.com`
   - Password: `TestPass123!`
   - Auto Confirm User: **Yes** (check this box)
   - Click **Create user**
   - **Copy the User ID** (UUID) - you'll need this for testing

3. **Create Test User 2**
   - Click **Add user** → **Create new user**
   - Email: `testuser2@example.com`
   - Password: `TestPass123!`
   - Auto Confirm User: **Yes** (check this box)
   - Click **Create user**
   - **Copy the User ID** (UUID) - you'll need this for testing

### Option B: Using SQL Script

Run this SQL in the Supabase SQL Editor:

```sql
-- Create test user 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'testuser1@example.com',
  crypt('TestPass123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create test user 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'testuser2@example.com',
  crypt('TestPass123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the user IDs
SELECT id, email FROM auth.users WHERE email IN ('testuser1@example.com', 'testuser2@example.com');
```

**Save the User IDs** from the query result. You'll use these throughout the tests.

---

## Part 2: Test SELECT Operations (Read Isolation)

### Goal
Verify that each user can only see their own cart and wishlist items.

### Setup Test Data

First, create some test data for both users. Run this in the SQL Editor (replace `USER1_ID` and `USER2_ID` with actual UUIDs):

```sql
-- Get a valid product_id first
SELECT id FROM products LIMIT 1;

-- Insert cart items for User 1 (replace USER1_ID and PRODUCT_ID)
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES 
  ('USER1_ID', 'PRODUCT_ID', 2, 'M', 99.90, 'Test Product 1'),
  ('USER1_ID', 'PRODUCT_ID', 1, 'L', 99.90, 'Test Product 1');

-- Insert cart items for User 2 (replace USER2_ID and PRODUCT_ID)
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES 
  ('USER2_ID', 'PRODUCT_ID', 3, 'G', 99.90, 'Test Product 2');

-- Insert wishlist items for User 1
INSERT INTO wishlist_items (user_id, product_id)
VALUES ('USER1_ID', 'PRODUCT_ID');

-- Insert wishlist items for User 2
INSERT INTO wishlist_items (user_id, product_id)
VALUES ('USER2_ID', 'PRODUCT_ID');
```

### Test SELECT with User 1 Context

To test as User 1, you need to set the JWT context. In Supabase SQL Editor:

```sql
-- Set JWT context to User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Query cart_items
SELECT * FROM cart_items;

-- Query wishlist_items
SELECT * FROM wishlist_items;
```

**Expected Result:**
- You should see **only** the 2 cart items belonging to User 1
- You should see **only** the 1 wishlist item belonging to User 1
- User 2's data should **NOT** appear

### Test SELECT with User 2 Context

```sql
-- Set JWT context to User 2
SET request.jwt.claim.sub = 'USER2_ID';

-- Query cart_items
SELECT * FROM cart_items;

-- Query wishlist_items
SELECT * FROM wishlist_items;
```

**Expected Result:**
- You should see **only** the 1 cart item belonging to User 2
- You should see **only** the 1 wishlist item belonging to User 2
- User 1's data should **NOT** appear

### Test SELECT as Unauthenticated User

```sql
-- Clear JWT context (simulate unauthenticated user)
RESET request.jwt.claim.sub;

-- Query cart_items
SELECT * FROM cart_items;

-- Query wishlist_items
SELECT * FROM wishlist_items;
```

**Expected Result:**
- Both queries should return **zero rows**
- No data should be visible to unauthenticated users

---

## Part 3: Test INSERT Operations (Write Protection)

### Goal
Verify that users can only insert items with their own `user_id`.

### Test Valid INSERT (User 1 inserting with own user_id)

```sql
-- Set JWT context to User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Try to insert cart item with User 1's ID (should succeed)
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES ('USER1_ID', 'PRODUCT_ID', 1, 'P', 89.90, 'Valid Insert Test');

-- Verify it was inserted
SELECT * FROM cart_items WHERE product_name_snapshot = 'Valid Insert Test';
```

**Expected Result:**
- INSERT should **succeed**
- SELECT should return the newly inserted row

### Test Invalid INSERT (User 1 trying to insert with User 2's user_id)

```sql
-- Still as User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Try to insert cart item with User 2's ID (should fail)
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES ('USER2_ID', 'PRODUCT_ID', 1, 'P', 89.90, 'Invalid Insert Test');
```

**Expected Result:**
- INSERT should **FAIL** with an RLS policy violation error
- Error message should indicate policy violation (e.g., "new row violates row-level security policy")

### Test Wishlist INSERT Protection

```sql
-- Set JWT context to User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Valid insert (should succeed)
INSERT INTO wishlist_items (user_id, product_id)
VALUES ('USER1_ID', 'ANOTHER_PRODUCT_ID');

-- Invalid insert (should fail)
INSERT INTO wishlist_items (user_id, product_id)
VALUES ('USER2_ID', 'ANOTHER_PRODUCT_ID');
```

**Expected Result:**
- First INSERT should **succeed**
- Second INSERT should **FAIL** with RLS policy violation

---

## Part 4: Test UPDATE Operations (Modification Protection)

### Goal
Verify that users can only update their own items.

### Test Valid UPDATE (User 1 updating own item)

```sql
-- Set JWT context to User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Get one of User 1's cart items
SELECT id FROM cart_items WHERE user_id = 'USER1_ID' LIMIT 1;

-- Update User 1's own cart item (should succeed)
UPDATE cart_items 
SET quantity = 5 
WHERE id = 'CART_ITEM_ID_FROM_ABOVE';

-- Verify the update
SELECT id, quantity FROM cart_items WHERE id = 'CART_ITEM_ID_FROM_ABOVE';
```

**Expected Result:**
- UPDATE should **succeed**
- SELECT should show `quantity = 5`

### Test Invalid UPDATE (User 1 trying to update User 2's item)

```sql
-- Still as User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Get one of User 2's cart items
SELECT id FROM cart_items WHERE user_id = 'USER2_ID' LIMIT 1;

-- Try to update User 2's cart item (should fail)
UPDATE cart_items 
SET quantity = 99 
WHERE id = 'USER2_CART_ITEM_ID';
```

**Expected Result:**
- UPDATE should appear to succeed but **affect 0 rows**
- This is because RLS filters out rows that don't belong to User 1
- Verify with: `SELECT id, quantity FROM cart_items WHERE id = 'USER2_CART_ITEM_ID';` (as User 2) - quantity should be unchanged

### Test UPDATE with user_id Change Attempt

```sql
-- Set JWT context to User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Try to change user_id of own item to User 2 (should fail)
UPDATE cart_items 
SET user_id = 'USER2_ID' 
WHERE user_id = 'USER1_ID' 
LIMIT 1;
```

**Expected Result:**
- UPDATE should **FAIL** with RLS policy violation
- The `WITH CHECK` clause prevents changing `user_id` to another user

---

## Part 5: Test DELETE Operations (Deletion Protection)

### Goal
Verify that users can only delete their own items.

### Test Valid DELETE (User 1 deleting own item)

```sql
-- Set JWT context to User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Get one of User 1's cart items
SELECT id FROM cart_items WHERE user_id = 'USER1_ID' LIMIT 1;

-- Delete User 1's own cart item (should succeed)
DELETE FROM cart_items WHERE id = 'CART_ITEM_ID';

-- Verify deletion
SELECT * FROM cart_items WHERE id = 'CART_ITEM_ID';
```

**Expected Result:**
- DELETE should **succeed**
- SELECT should return **zero rows** (item was deleted)

### Test Invalid DELETE (User 1 trying to delete User 2's item)

```sql
-- Still as User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Get one of User 2's cart items
SELECT id FROM cart_items WHERE user_id = 'USER2_ID' LIMIT 1;

-- Try to delete User 2's cart item (should fail silently)
DELETE FROM cart_items WHERE id = 'USER2_CART_ITEM_ID';

-- Verify item still exists (check as User 2)
SET request.jwt.claim.sub = 'USER2_ID';
SELECT * FROM cart_items WHERE id = 'USER2_CART_ITEM_ID';
```

**Expected Result:**
- DELETE should appear to succeed but **affect 0 rows**
- When checking as User 2, the item should **still exist**
- RLS prevents User 1 from even seeing User 2's items to delete them

### Test Wishlist DELETE Protection

```sql
-- Set JWT context to User 1
SET request.jwt.claim.sub = 'USER1_ID';

-- Valid delete (should succeed)
DELETE FROM wishlist_items WHERE user_id = 'USER1_ID' LIMIT 1;

-- Invalid delete (should affect 0 rows)
DELETE FROM wishlist_items WHERE user_id = 'USER2_ID';

-- Verify User 2's wishlist is intact
SET request.jwt.claim.sub = 'USER2_ID';
SELECT COUNT(*) FROM wishlist_items WHERE user_id = 'USER2_ID';
```

**Expected Result:**
- First DELETE should **succeed** and remove 1 row
- Second DELETE should **affect 0 rows**
- User 2's wishlist count should be unchanged

---

## Part 6: Testing via Application (Frontend)

### Setup

1. **Login as Test User 1**
   - Navigate to your application's login page
   - Email: `testuser1@example.com`
   - Password: `TestPass123!`

2. **Add items to cart and wishlist**
   - Add 2-3 products to the cart
   - Add 1-2 products to the wishlist
   - Note the product IDs or names

3. **Logout and Login as Test User 2**
   - Logout from User 1
   - Login with User 2 credentials
   - Email: `testuser2@example.com`
   - Password: `TestPass123!`

### Test Cases

#### Test 1: Cart Isolation
**Action:** View cart as User 2  
**Expected:** Cart should be empty (or contain only User 2's items, not User 1's items)

#### Test 2: Wishlist Isolation
**Action:** View wishlist as User 2  
**Expected:** Wishlist should be empty (or contain only User 2's items, not User 1's items)

#### Test 3: Add to Cart
**Action:** Add products to cart as User 2  
**Expected:** Products should be added successfully

#### Test 4: Cross-User Verification
**Action:** 
1. Add items as User 2
2. Logout and login as User 1
3. Check cart and wishlist

**Expected:** User 1 should see only their own items, not User 2's newly added items

#### Test 5: Browser DevTools Check
**Action:**
1. Login as User 1
2. Open browser DevTools → Network tab
3. Add item to cart
4. Inspect the API request/response

**Expected:**
- Request should include JWT token in Authorization header
- Response should only contain User 1's cart items
- No data from other users should be visible in the response

---

## Part 7: Expected Results Summary

### ✅ Successful RLS Implementation

If RLS is working correctly, you should observe:

1. **SELECT Operations**
   - Users only see their own data
   - Unauthenticated users see nothing
   - No cross-user data leakage

2. **INSERT Operations**
   - Users can insert items with their own `user_id`
   - Attempts to insert with another user's `user_id` fail with RLS error
   - Unauthenticated users cannot insert

3. **UPDATE Operations**
   - Users can update their own items
   - Attempts to update other users' items affect 0 rows
   - Attempts to change `user_id` fail with RLS error

4. **DELETE Operations**
   - Users can delete their own items
   - Attempts to delete other users' items affect 0 rows
   - Deleted items are truly removed

5. **Application Level**
   - Each user sees only their own cart and wishlist
   - No data leakage between users
   - All operations respect user boundaries

### ❌ Signs of RLS Issues

If you observe any of these, RLS is **NOT** working correctly:

1. User 1 can see User 2's cart or wishlist items
2. User can insert items with another user's `user_id`
3. User can update or delete another user's items
4. Unauthenticated users can see any data
5. Application shows mixed data from multiple users

---

## Part 8: Troubleshooting

### Issue: RLS policies not being applied

**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cart_items', 'wishlist_items');
```

**Expected:** `rowsecurity` should be `true` for both tables

**Fix:**
```sql
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
```

### Issue: Policies don't exist

**Check:**
```sql
-- List all policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('cart_items', 'wishlist_items')
ORDER BY tablename, cmd;
```

**Expected:** You should see policies for SELECT, INSERT, UPDATE, DELETE on both tables

### Issue: JWT context not being set

**Check:**
```sql
-- Check current JWT context
SELECT current_setting('request.jwt.claim.sub', true);
```

**Expected:** Should return the user UUID when authenticated

### Issue: Service Role Key being used

**Problem:** If the application uses `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY`, RLS is bypassed.

**Check:** Review your frontend code to ensure it uses:
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // ✅ Correct
  // NOT process.env.SUPABASE_SERVICE_ROLE_KEY! // ❌ Wrong
);
```

---

## Part 9: Cleanup

After testing, you may want to remove test data and users:

```sql
-- Delete test cart items
DELETE FROM cart_items WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('testuser1@example.com', 'testuser2@example.com')
);

-- Delete test wishlist items
DELETE FROM wishlist_items WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('testuser1@example.com', 'testuser2@example.com')
);

-- Delete test users (optional - you may want to keep them for future testing)
DELETE FROM auth.users WHERE email IN ('testuser1@example.com', 'testuser2@example.com');
```

---

## Conclusion

This manual testing guide validates that RLS policies are correctly protecting user data. All tests should pass with proper isolation between users. If any test fails, review the RLS policies and ensure they are correctly configured with `auth.uid() = user_id` conditions.

**Remember:** RLS is your primary security boundary. Never rely solely on application-level checks for data isolation.
