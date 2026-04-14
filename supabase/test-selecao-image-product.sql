-- ============================================================================
-- TESTE CONTROLADO: IMAGEM DO PRODUTO "CAMISA DA SELECAO"
-- Produto alvo: e6171fc7-050e-4a3c-b85d-43f3cb66e735
-- ============================================================================
-- Objetivo:
-- 1) Fazer pre-check do image_url atual
-- 2) Atualizar apenas este produto para /products/selecao-vini.avif
-- 3) Manter SQL de rollback rapido
-- ============================================================================

-- 1) PRE-CHECK (antes do update)
SELECT id, name, image_url
FROM products
WHERE id = 'e6171fc7-050e-4a3c-b85d-43f3cb66e735';

-- 2) UPDATE DE TESTE (somente produto alvo)
UPDATE products
SET image_url = '/products/selecao-vini.avif',
    updated_at = now()
WHERE id = 'e6171fc7-050e-4a3c-b85d-43f3cb66e735';

-- 3) POS-CHECK
SELECT id, name, image_url
FROM products
WHERE id = 'e6171fc7-050e-4a3c-b85d-43f3cb66e735';

-- ============================================================================
-- ROLLBACK (execute somente se precisar voltar)
-- ============================================================================
-- Opcao A: restaurar valor anterior manualmente (substitua <IMAGE_URL_ANTIGA>)
-- UPDATE products
-- SET image_url = '<IMAGE_URL_ANTIGA>',
--     updated_at = now()
-- WHERE id = 'e6171fc7-050e-4a3c-b85d-43f3cb66e735';

-- Opcao B: trocar para a segunda imagem de teste
-- UPDATE products
-- SET image_url = '/products/selecao-paqueta.avif',
--     updated_at = now()
-- WHERE id = 'e6171fc7-050e-4a3c-b85d-43f3cb66e735';
