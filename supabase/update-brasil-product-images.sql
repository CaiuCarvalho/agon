-- Atualizar produto "Brasil" com múltiplas imagens da Seleção Brasileira
-- Execute este script no Supabase SQL Editor ou via CLI

-- 1. Adicionar coluna images se não existir
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

COMMENT ON COLUMN products.images IS 'Array de URLs de imagens adicionais do produto';

-- 2. Atualizar produto Brasil com todas as imagens
UPDATE products 
SET 
  image_url = '/products/selecao/vini.jn.camisaselecao.avif', -- Imagem principal (menor tamanho, carrega rápido)
  images = ARRAY[
    '/products/selecao/vini.jn.camisaselecao.avif',
    '/products/selecao/paqueta.camisaselecao.avif',
    '/products/selecao/selecao1.avif',
    '/products/selecao/10977200A3.avif',
    '/products/selecao/10977200A5.avif',
    '/products/selecao/10977200A6.avif',
    '/products/selecao/10977200A7.avif',
    '/products/selecao/10977200A8.avif'
  ],
  updated_at = NOW()
WHERE name = 'Brasil';

-- 3. Verificar atualização
SELECT 
  id,
  name,
  image_url,
  images,
  array_length(images, 1) as total_images,
  updated_at
FROM products 
WHERE name = 'Brasil';

-- Resultado esperado:
-- - image_url: /products/selecao/vini.jn.camisaselecao.avif
-- - images: array com 8 imagens
-- - total_images: 8
-- - updated_at: timestamp atual
