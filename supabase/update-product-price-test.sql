-- Script para alterar o preço de um produto para teste
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos ver os produtos disponíveis
SELECT id, name, price FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5;

-- Depois de escolher um produto, execute o UPDATE abaixo
-- Substitua 'PRODUCT_ID_AQUI' pelo ID do produto que você quer alterar

-- UPDATE products 
-- SET price = 4.00 
-- WHERE id = 'PRODUCT_ID_AQUI';

-- Exemplo: Se você quiser alterar o primeiro produto da lista
-- UPDATE products 
-- SET price = 4.00 
-- WHERE id = (SELECT id FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1);

-- Ou se você souber o nome do produto:
-- UPDATE products 
-- SET price = 4.00 
-- WHERE name ILIKE '%nome-do-produto%' AND deleted_at IS NULL;

-- Verificar a alteração
-- SELECT id, name, price FROM products WHERE price = 4.00;
