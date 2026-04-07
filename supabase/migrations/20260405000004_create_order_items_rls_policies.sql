-- Create RLS policies for order_items table
-- Requirements: 3.5-3.6

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read order items for their own orders
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Users can only insert order items for their own orders
CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Only admins can update order items
CREATE POLICY "order_items_update_admin"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete order items
CREATE POLICY "order_items_delete_admin"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "order_items_select_own" ON order_items IS 'Users can only view items from their own orders';
COMMENT ON POLICY "order_items_insert_own" ON order_items IS 'Users can only create items for their own orders';
COMMENT ON POLICY "order_items_update_admin" ON order_items IS 'Only admins can update order items';
COMMENT ON POLICY "order_items_delete_admin" ON order_items IS 'Only admins can delete order items';
