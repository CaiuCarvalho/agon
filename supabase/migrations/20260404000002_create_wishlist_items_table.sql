-- Create wishlist_items table with RLS policies
-- Requirements: 7.1, 7.2, 7.3, 11.1, 11.2, 11.3, 11.4, 12.2, 12.4, 12.6, 14.2, 14.4

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one entry per (user, product) combination
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX idx_wishlist_items_created_at ON wishlist_items(created_at DESC);

-- Enable Row Level Security
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own wishlist items
CREATE POLICY "wishlist_items_select_own"
  ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own wishlist items
CREATE POLICY "wishlist_items_insert_own"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own wishlist items
CREATE POLICY "wishlist_items_delete_own"
  ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE wishlist_items IS 'Wishlist (favorites) items for authenticated users with 20-item limit';
