-- Fix Product Image URLs
-- This script updates product image URLs to use the correct path
-- Run this in Supabase SQL Editor (Production)

-- Check current image URLs
SELECT id, name, image_url 
FROM products 
WHERE image_url LIKE '/products/%'
ORDER BY id;

-- Update image URLs to correct path
-- From: /products/product-xxx.jpg
-- To: /images/products/product-xxx.jpg
UPDATE products 
SET image_url = '/images/products/' || SUBSTRING(image_url FROM '[^/]+$')
WHERE image_url LIKE '/products/%';

-- Verify update
SELECT id, name, image_url 
FROM products 
WHERE image_url LIKE '/images/products/%'
ORDER BY id;

-- Expected result: All products should now have image_url starting with /images/products/
