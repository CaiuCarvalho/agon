-- Create RLS policies for orders table
-- Requirements: 3.1-3.4

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own orders
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own orders
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own orders, admins can update any order
CREATE POLICY "orders_update_own_or_admin"
  ON orders FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete orders
CREATE POLICY "orders_delete_admin"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "orders_select_own" ON orders IS 'Users can only view their own orders';
COMMENT ON POLICY "orders_insert_own" ON orders IS 'Users can only create orders for themselves';
COMMENT ON POLICY "orders_update_own_or_admin" ON orders IS 'Users can update their own orders, admins can update any';
COMMENT ON POLICY "orders_delete_admin" ON orders IS 'Only admins can delete orders';
