-- Admin Panel RLS Policies
-- Creates Row Level Security policies for admin operations
-- These are the LAST LINE OF DEFENSE - backend validation is primary

-- ============================================
-- PRODUCTS TABLE - Admin Operations
-- ============================================

-- Admin can SELECT all products (including soft-deleted)
CREATE POLICY "admin_select_products"
ON products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can INSERT products
CREATE POLICY "admin_insert_products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can UPDATE products
CREATE POLICY "admin_update_products"
ON products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can DELETE products (soft delete via updated_at)
CREATE POLICY "admin_delete_products"
ON products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- ORDERS TABLE - Admin Read Access
-- ============================================

-- Admin can SELECT all orders
CREATE POLICY "admin_select_orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can UPDATE orders (for shipping info)
CREATE POLICY "admin_update_orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- ORDER_ITEMS TABLE - Admin Read Access
-- ============================================

-- Admin can SELECT all order items
CREATE POLICY "admin_select_order_items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- PAYMENTS TABLE - Admin Read Access
-- ============================================

-- Admin can SELECT all payments
CREATE POLICY "admin_select_payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "admin_select_products" ON products IS 
'Allows admin users to view all products including soft-deleted ones';

COMMENT ON POLICY "admin_insert_products" ON products IS 
'Allows admin users to create new products';

COMMENT ON POLICY "admin_update_products" ON products IS 
'Allows admin users to update product information and stock';

COMMENT ON POLICY "admin_delete_products" ON products IS 
'Allows admin users to delete products (soft delete)';

COMMENT ON POLICY "admin_select_orders" ON orders IS 
'Allows admin users to view all orders for management';

COMMENT ON POLICY "admin_update_orders" ON orders IS 
'Allows admin users to update shipping information';

COMMENT ON POLICY "admin_select_order_items" ON order_items IS 
'Allows admin users to view order items for order management';

COMMENT ON POLICY "admin_select_payments" ON payments IS 
'Allows admin users to view payment information for orders';
