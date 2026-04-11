-- ============================================================================
-- FIX: Atualizar URLs de Imagens de Produtos para Usar Imagens Genéricas
-- ============================================================================
-- 
-- PROBLEMA:
-- - Produtos no banco referenciam imagens específicas que não existem
-- - Causando erros 404 no frontend
-- 
-- SOLUÇÃO:
-- - Mapear produtos para as 6 imagens genéricas existentes:
--   * product-ball.jpg (bola)
--   * product-jersey.jpg (camisa)
--   * product-scarf.jpg (cachecol)
--   * product-shorts.jpg (shorts)
--   * product-cap.jpg (boné)
--   * product-bag.jpg (bolsa)
-- 
-- ESTRATÉGIA:
-- - Todos os produtos de "manto oficial" usam product-jersey.jpg
-- - Produtos futuros de outras categorias usarão imagens apropriadas
-- 
-- ============================================================================

-- Atualizar todos os produtos da categoria "manto-oficial" para usar a imagem genérica de camisa
UPDATE products
SET image_url = '/products/product-jersey.jpg'
WHERE category_id = (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1)
  AND image_url LIKE '/products/%'
  AND image_url NOT IN (
    '/products/product-ball.jpg',
    '/products/product-jersey.jpg',
    '/products/product-scarf.jpg',
    '/products/product-shorts.jpg',
    '/products/product-cap.jpg',
    '/products/product-bag.jpg'
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Mostrar produtos atualizados
SELECT 
  id,
  name,
  image_url,
  category_id
FROM products
WHERE deleted_at IS NULL
ORDER BY name;

-- Contar produtos por imagem
SELECT 
  image_url,
  COUNT(*) as total_produtos
FROM products
WHERE deleted_at IS NULL
GROUP BY image_url
ORDER BY total_produtos DESC;

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- 1. Esta é uma solução temporária usando imagens genéricas
-- 2. Para adicionar imagens específicas dos times no futuro:
--    a. Adicione as imagens em apps/web/public/products/
--    b. Execute UPDATE para produtos específicos:
--       UPDATE products 
--       SET image_url = '/products/flamengo.jpg' 
--       WHERE name = 'Flamengo';
--
-- 3. Imagens genéricas disponíveis:
--    - product-ball.jpg → Para produtos de bola
--    - product-jersey.jpg → Para camisas (usado aqui)
--    - product-scarf.jpg → Para cachecóis
--    - product-shorts.jpg → Para shorts
--    - product-cap.jpg → Para bonés
--    - product-bag.jpg → Para bolsas
--
-- ============================================================================
