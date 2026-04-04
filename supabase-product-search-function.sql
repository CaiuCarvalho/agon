-- Product Full-Text Search Function
-- This function enables full-text search on products using PostgreSQL's to_tsvector
-- with Portuguese language support for both name and description fields

CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM products
  WHERE deleted_at IS NULL
    AND (
      to_tsvector('portuguese', name) @@ plainto_tsquery('portuguese', search_term)
      OR to_tsvector('portuguese', description) @@ plainto_tsquery('portuguese', search_term)
    );
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION search_products(TEXT) TO authenticated, anon;

-- Example usage:
-- SELECT * FROM search_products('camisa');
-- SELECT * FROM search_products('bola futebol');
