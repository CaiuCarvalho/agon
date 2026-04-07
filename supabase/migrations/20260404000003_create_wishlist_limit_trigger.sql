-- Create wishlist limit enforcement trigger
-- Requirements: 8.1, 8.2, 8.3, 8.4

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
CREATE TRIGGER enforce_wishlist_limit
  BEFORE INSERT ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION check_wishlist_limit();

-- Add comment for documentation
COMMENT ON FUNCTION check_wishlist_limit() IS 'Enforces 20-item limit per user on wishlist_items table';
