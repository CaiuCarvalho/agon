-- Create orders table for storing customer orders
-- Requirements: 1.1-1.17

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Financial information
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- Shipping information
  shipping_name TEXT NOT NULL CHECK (char_length(shipping_name) > 0 AND char_length(shipping_name) <= 200),
  shipping_address TEXT NOT NULL CHECK (char_length(shipping_address) > 0 AND char_length(shipping_address) <= 500),
  shipping_city TEXT NOT NULL CHECK (char_length(shipping_city) > 0 AND char_length(shipping_city) <= 100),
  shipping_state TEXT NOT NULL CHECK (shipping_state IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')),
  shipping_zip TEXT NOT NULL CHECK (shipping_zip ~ '^\d{5}-\d{3}$'),
  shipping_phone TEXT NOT NULL CHECK (shipping_phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'),
  shipping_email TEXT NOT NULL CHECK (shipping_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  
  -- Payment information
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Add comment for documentation
COMMENT ON TABLE orders IS 'Stores customer orders with shipping information and payment method';
COMMENT ON COLUMN orders.status IS 'Order status: pending, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.total_amount IS 'Total order amount in Brazilian Real (BRL)';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: cash_on_delivery (MVP only)';
