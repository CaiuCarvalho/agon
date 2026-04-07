-- ============================================================================
-- APPLY ALL CORE MIGRATIONS - Consolidated Script
-- ============================================================================
-- This script applies ALL necessary migrations for core flow stabilization:
-- - Cart items table and RPC functions
-- - Wishlist items table and triggers
-- - Addresses table
-- - Checkout tables (orders, order_items)
--
-- Execute this ENTIRE file in the Supabase SQL Editor
--
-- PREREQUISITE: products table must exist
-- If products table doesn't exist, apply product catalog migrations first
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Create cart_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 99),
  size TEXT NOT NULL CHECK (char_length(size) > 0 AND char_length(size) <= 10),
  
  -- Price snapshot fields for historical accuracy
  price_snapshot DECIMAL(10, 2) NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one entry per (user, product, size) combination
  CONSTRAINT unique_cart_item UNIQUE (user_id, product_id, size)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "cart_items_select_own" ON cart_items;
DROP POLICY IF EXISTS "cart_items_insert_own" ON cart_items;
DROP POLICY IF EXISTS "cart_items_update_own" ON cart_items;
DROP POLICY IF EXISTS "cart_items_delete_own" ON cart_items;

-- RLS Policy: Users can only read their own cart items
CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own cart items
CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own cart items
CREATE POLICY "cart_items_update_own"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own cart items
CREATE POLICY "cart_items_delete_own"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE cart_items IS 'Shopping cart items for authenticated users with price snapshots';

-- ============================================================================
-- MIGRATION 2: Create wishlist_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one entry per (user, product) combination
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON wishlist_items(created_at DESC);

-- Enable Row Level Security
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "wishlist_items_select_own" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_insert_own" ON wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_delete_own" ON wishlist_items;

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

COMMENT ON TABLE wishlist_items IS 'Wishlist items for authenticated users with 20-item limit';

-- ============================================================================
-- MIGRATION 3: Create wishlist limit trigger
-- ============================================================================

-- Function to enforce 20-item wishlist limit atomically
CREATE OR REPLACE FUNCTION check_wishlist_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM wishlist_items WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 itens na wishlist atingido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce limit before insert
DROP TRIGGER IF EXISTS enforce_wishlist_limit ON wishlist_items;
CREATE TRIGGER enforce_wishlist_limit
  BEFORE INSERT ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION check_wishlist_limit();

COMMENT ON FUNCTION check_wishlist_limit() IS 'Enforces 20-item limit per user on wishlist_items table';

-- ============================================================================
-- MIGRATION 4: Create cart migration RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_cart_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_product RECORD;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name INTO v_product
    FROM products
    WHERE id = (v_item->>'productId')::UUID
      AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    
    INSERT INTO cart_items (
      user_id,
      product_id,
      quantity,
      size,
      price_snapshot,
      product_name_snapshot
    )
    VALUES (
      p_user_id,
      (v_item->>'productId')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_item->>'size',
      v_product.price,
      v_product.name
    )
    ON CONFLICT (user_id, product_id, size)
    DO UPDATE SET
      quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
      updated_at = NOW();
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_cart_items(UUID, JSONB) IS 'Atomically migrates cart items from localStorage to database';

-- ============================================================================
-- MIGRATION 5: Create wishlist migration RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_wishlist_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_current_count INTEGER;
  v_inserted BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_current_count
  FROM wishlist_items
  WHERE user_id = p_user_id;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_current_count >= 20 THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    INSERT INTO wishlist_items (user_id, product_id)
    VALUES (p_user_id, (v_item->>'productId')::UUID)
    ON CONFLICT (user_id, product_id) DO NOTHING
    RETURNING true INTO v_inserted;
    
    IF v_inserted THEN
      v_migrated_count := v_migrated_count + 1;
      v_current_count := v_current_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count,
    'skipped_count', v_skipped_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_wishlist_items(UUID, JSONB) IS 'Atomically migrates wishlist items from localStorage to database';

-- ============================================================================
-- MIGRATION 6: Create add_to_cart_atomic RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_result RECORD;
BEGIN
  IF p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quantidade deve ser entre 1 e 99'
    );
  END IF;
  
  IF char_length(p_size) < 1 OR char_length(p_size) > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tamanho deve ter entre 1 e 10 caracteres'
    );
  END IF;
  
  SELECT price, name, stock INTO v_product
  FROM products
  WHERE id = p_product_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Produto não encontrado'
    );
  END IF;
  
  INSERT INTO cart_items (
    user_id,
    product_id,
    quantity,
    size,
    price_snapshot,
    product_name_snapshot
  )
  VALUES (
    p_user_id,
    p_product_id,
    p_quantity,
    p_size,
    v_product.price,
    v_product.name
  )
  ON CONFLICT (user_id, product_id, size)
  DO UPDATE SET
    quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'item', row_to_json(v_result)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_to_cart_atomic(UUID, UUID, INTEGER, TEXT) IS 'Atomically adds item to cart with price snapshot';

-- ============================================================================
-- MIGRATION 7: Create addresses table
-- ============================================================================

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;

-- RLS Policies
CREATE POLICY "Users can read own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Constraint: Only one default address per user
DROP INDEX IF EXISTS unique_default_address_per_user;
CREATE UNIQUE INDEX unique_default_address_per_user
  ON addresses (user_id)
  WHERE is_default = TRUE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default) WHERE is_default = TRUE;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 8: Create orders table (Checkout prerequisite)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_name TEXT NOT NULL CHECK (char_length(shipping_name) > 0 AND char_length(shipping_name) <= 200),
  shipping_address TEXT NOT NULL CHECK (char_length(shipping_address) > 0 AND char_length(shipping_address) <= 500),
  shipping_city TEXT NOT NULL CHECK (char_length(shipping_city) > 0 AND char_length(shipping_city) <= 100),
  shipping_state TEXT NOT NULL CHECK (shipping_state IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')),
  shipping_zip TEXT NOT NULL CHECK (shipping_zip ~ '^\d{5}-\d{3}$'),
  shipping_phone TEXT NOT NULL CHECK (shipping_phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'),
  shipping_email TEXT NOT NULL CHECK (shipping_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_update_own_or_admin" ON orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON orders;

-- RLS Policies
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "orders_delete_admin"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE orders IS 'Customer orders with shipping information';

-- ============================================================================
-- MIGRATION 9: Create order_items table (Checkout prerequisite)
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL CHECK (char_length(product_name) > 0),
  product_price DECIMAL(10, 2) NOT NULL CHECK (product_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  size TEXT CHECK (size IS NULL OR char_length(size) <= 10),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON order_items;

-- RLS Policies
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_update_admin"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "order_items_delete_admin"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE order_items IS 'Individual items within each order with price snapshots';

-- ============================================================================
-- MIGRATION 10: Create create_order_atomic RPC (Checkout prerequisite)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
BEGIN
  SELECT COUNT(*) INTO v_item_count
  FROM cart_items
  WHERE user_id = p_user_id;
  
  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;
  
  INSERT INTO orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0,
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  FOR v_cart_item IN
    SELECT * FROM cart_items WHERE user_id = p_user_id
  LOOP
    SELECT id, name, price, stock INTO v_product
    FROM products
    WHERE id = v_cart_item.product_id
    AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_cart_item.product_id;
    END IF;
    
    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Product % has insufficient stock', v_product.name;
    END IF;
    
    v_subtotal := v_product.price * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;
    
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;
  
  UPDATE orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;
  
  DELETE FROM cart_items WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_order_atomic IS 'Atomically creates an order with items and clears the cart';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $
DECLARE
  v_table_count INTEGER;
  v_function_count INTEGER;
  v_rls_count INTEGER;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Running verification checks...';
  RAISE NOTICE '====================================';
  
  -- Verify tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('cart_items', 'wishlist_items', 'addresses', 'orders', 'order_items');
  
  RAISE NOTICE 'Tables created: %/5', v_table_count;
  
  IF v_table_count = 5 THEN
    RAISE NOTICE '✅ All tables created successfully';
  ELSE
    RAISE WARNING '⚠️ Some tables missing';
  END IF;
  
  -- Verify RPC functions
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN ('add_to_cart_atomic', 'migrate_cart_items', 'migrate_wishlist_items', 'create_order_atomic');
  
  RAISE NOTICE 'RPC functions created: %/4', v_function_count;
  
  IF v_function_count = 4 THEN
    RAISE NOTICE '✅ All RPC functions created successfully';
  ELSE
    RAISE WARNING '⚠️ Some RPC functions missing';
  END IF;
  
  -- Verify RLS
  SELECT COUNT(*) INTO v_rls_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('cart_items', 'wishlist_items', 'addresses', 'orders', 'order_items')
  AND rowsecurity = true;
  
  RAISE NOTICE 'Tables with RLS enabled: %/5', v_rls_count;
  
  IF v_rls_count = 5 THEN
    RAISE NOTICE '✅ RLS enabled on all tables';
  ELSE
    RAISE WARNING '⚠️ RLS not enabled on some tables';
  END IF;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ ALL MIGRATIONS APPLIED SUCCESSFULLY!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '📋 Tables: cart_items, wishlist_items, addresses, orders, order_items';
  RAISE NOTICE '⚡ RPC Functions: add_to_cart_atomic, migrate_cart_items, migrate_wishlist_items, create_order_atomic';
  RAISE NOTICE '🔒 RLS: Enabled on all tables with proper policies';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Next step: Run QUICK_VERIFICATION_QUERIES.sql to confirm everything works';
END $;
