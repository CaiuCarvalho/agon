-- Create order_items table for storing products in each order
-- Requirements: 2.1-2.11, 20.1-20.5

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Product snapshot (immutable historical data)
  product_name TEXT NOT NULL CHECK (char_length(product_name) > 0),
  product_price DECIMAL(10, 2) NOT NULL CHECK (product_price >= 0),
  
  -- Order details
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  size TEXT CHECK (size IS NULL OR char_length(size) <= 10),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Add comments for documentation
COMMENT ON TABLE order_items IS 'Stores individual items within each order with price snapshots';
COMMENT ON COLUMN order_items.product_name IS 'Product name snapshot at time of order (immutable)';
COMMENT ON COLUMN order_items.product_price IS 'Product price snapshot at time of order (immutable)';
COMMENT ON COLUMN order_items.subtotal IS 'Calculated as product_price * quantity';
COMMENT ON COLUMN order_items.size IS 'Product size/variant (optional, e.g., P, M, G)';
