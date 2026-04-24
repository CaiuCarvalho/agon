-- =============================================================================
-- Add sizes column to products and create product-images storage bucket
-- =============================================================================

-- Add sizes array column (available sizes per product, e.g. P, M, G, GG)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}';

-- =============================================================================
-- Supabase Storage: product-images bucket
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access for product images
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Authenticated admins can upload product images
CREATE POLICY "product_images_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated admins can delete product images
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
