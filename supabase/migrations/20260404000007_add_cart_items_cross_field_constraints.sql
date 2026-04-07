-- Add cross-field validation constraints to cart_items table
-- Requirements: 33.1, 33.2, 33.3, 33.4

-- Add CHECK constraint: price_snapshot must be positive
ALTER TABLE cart_items
ADD CONSTRAINT check_price_snapshot_positive
CHECK (price_snapshot > 0);

-- Add CHECK constraint: product_name_snapshot must not be empty
ALTER TABLE cart_items
ADD CONSTRAINT check_product_name_not_empty
CHECK (product_name_snapshot != '' AND char_length(product_name_snapshot) > 0);

-- Add CHECK constraint: prevent overflow (quantity * price_snapshot <= 999999)
ALTER TABLE cart_items
ADD CONSTRAINT check_total_price_overflow
CHECK (quantity * price_snapshot <= 999999);

-- Add CHECK constraint: created_at must be before or equal to updated_at
ALTER TABLE cart_items
ADD CONSTRAINT check_timestamps_order
CHECK (created_at <= updated_at);

-- Add comments for documentation
COMMENT ON CONSTRAINT check_price_snapshot_positive ON cart_items IS 'Ensures price_snapshot is always positive';
COMMENT ON CONSTRAINT check_product_name_not_empty ON cart_items IS 'Ensures product_name_snapshot is never empty';
COMMENT ON CONSTRAINT check_total_price_overflow ON cart_items IS 'Prevents arithmetic overflow by limiting total price to 999999';
COMMENT ON CONSTRAINT check_timestamps_order ON cart_items IS 'Ensures created_at is always before or equal to updated_at';
