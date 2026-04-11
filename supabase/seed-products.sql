-- ============================================================================
-- SEED: Produtos Reais do Catálogo
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Copie este arquivo completo
-- 2. Cole no Supabase Dashboard SQL Editor
-- 3. Clique em "Run" para executar
--
-- Este script:
-- - Limpa produtos existentes com os mesmos nomes (evita duplicação)
-- - Insere 9 produtos reais com dados mockados
-- - Usa UUIDs gerados automaticamente
-- - Mapeia para categorias existentes
-- - Define estoques saudáveis
--
-- ============================================================================

-- ============================================================================
-- 1. LIMPAR PRODUTOS EXISTENTES (SOFT DELETE - PRESERVA HISTÓRICO)
-- ============================================================================

-- Usar SOFT DELETE ao invés de DELETE para preservar histórico de pedidos
-- Isso evita violar foreign keys de order_items, cart_items, wishlist_items
UPDATE products 
SET deleted_at = now() 
WHERE name IN (
  'Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo', 
  'Brasil', 'Argentina', 'Real Madrid', 'Barcelona', 'PSG',
  'Santos', 'Grêmio', 'Internacional', 'Atlético Mineiro',
  'Cruzeiro', 'Vasco', 'Botafogo'
)
AND deleted_at IS NULL;

-- ============================================================================
-- 2. VERIFICAR CATEGORIAS EXISTENTES
-- ============================================================================

-- Verificar se as categorias existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'manto-oficial') THEN
    RAISE EXCEPTION 'Categoria "manto-oficial" não existe. Execute o schema migration primeiro.';
  END IF;
END $$;

-- ============================================================================
-- 3. INSERIR PRODUTOS
-- ============================================================================

-- Inserir produtos usando ON CONFLICT para permitir re-execução
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  image_url,
  stock,
  features,
  rating,
  reviews
)
VALUES
  -- Produtos Brasileiros (estoque saudável)
  (
    'Flamengo',
    'Camisa oficial do Clube de Regatas do Flamengo. Material de alta qualidade com tecnologia Dri-FIT para máximo conforto.',
    299.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/flamengo.jpg',
    15,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.8,
    127
  ),
  (
    'Corinthians',
    'Camisa oficial do Sport Club Corinthians Paulista. Design clássico com detalhes modernos e acabamento premium.',
    289.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/corinthians.jpg',
    12,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.7,
    98
  ),
  (
    'Palmeiras',
    'Camisa oficial da Sociedade Esportiva Palmeiras. Verde alviverde com tecnologia de ponta para máxima performance.',
    299.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/palmeiras.jpg',
    10,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.9,
    156
  ),
  (
    'São Paulo',
    'Camisa oficial do São Paulo Futebol Clube. Tricolor paulista com design elegante e materiais de primeira linha.',
    279.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/sao-paulo.jpg',
    8,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.6,
    73
  ),
  
  -- Seleções (estoque variado)
  (
    'Brasil',
    'Camisa oficial da Seleção Brasileira de Futebol. Amarelo canarinho com estrelas das conquistas mundiais.',
    349.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/brasil.jpg',
    10,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', '5 estrelas', 'Tamanhos P ao GG'],
    5.0,
    342
  ),
  (
    'Argentina',
    'Camisa oficial da Seleção Argentina de Futebol. Listras albicelestes com escudo AFA bordado.',
    349.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/argentina.jpg',
    4,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', '3 estrelas', 'Tamanhos P ao GG'],
    4.9,
    218
  ),
  
  -- Clubes Europeus (estoque limitado)
  (
    'Real Madrid',
    'Camisa oficial do Real Madrid Club de Fútbol. Branco imaculado com detalhes dourados, símbolo de excelência.',
    399.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/real-madrid.jpg',
    5,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Edição especial', 'Tamanhos P ao GG'],
    4.9,
    287
  ),
  (
    'Barcelona',
    'Camisa oficial do Futbol Club Barcelona. Listras blaugrana com design icônico e tecnologia de ponta.',
    399.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/barcelona.jpg',
    4,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Edição especial', 'Tamanhos P ao GG'],
    4.8,
    193
  ),
  (
    'PSG',
    'Camisa oficial do Paris Saint-Germain Football Club. Azul parisiense com detalhes vermelhos e brancos.',
    399.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/psg.jpg',
    3,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Edição especial', 'Tamanhos P ao GG'],
    4.7,
    164
  ),
  
  -- Mais Clubes Brasileiros (estoque variado)
  (
    'Santos',
    'Camisa oficial do Santos Futebol Clube. Branco imaculado com detalhes pretos, tradição e história.',
    289.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/santos.jpg',
    11,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.7,
    89
  ),
  (
    'Grêmio',
    'Camisa oficial do Grêmio Foot-Ball Porto Alegrense. Tricolor gaúcho com listras tradicionais.',
    289.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/gremio.jpg',
    9,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.8,
    112
  ),
  (
    'Internacional',
    'Camisa oficial do Sport Club Internacional. Vermelho colorado com design moderno e elegante.',
    289.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/internacional.jpg',
    10,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.7,
    95
  ),
  (
    'Atlético Mineiro',
    'Camisa oficial do Clube Atlético Mineiro. Preto e branco com design imponente do Galo.',
    289.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/atletico-mineiro.jpg',
    13,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.8,
    134
  ),
  (
    'Cruzeiro',
    'Camisa oficial do Cruzeiro Esporte Clube. Azul celeste com estrelas que representam conquistas.',
    279.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/cruzeiro.jpg',
    7,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.6,
    67
  ),
  (
    'Vasco',
    'Camisa oficial do Club de Regatas Vasco da Gama. Faixa diagonal preta sobre fundo branco.',
    279.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/vasco.jpg',
    8,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.6,
    71
  ),
  (
    'Botafogo',
    'Camisa oficial do Botafogo de Futebol e Regatas. Listras alvinegras com tradição carioca.',
    279.90,
    (SELECT id FROM categories WHERE slug = 'manto-oficial' LIMIT 1),
    '/products/botafogo.jpg',
    9,
    ARRAY['Tecnologia Dri-FIT', 'Material respirável', 'Escudo bordado', 'Tamanhos P ao GG'],
    4.7,
    82
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  image_url = EXCLUDED.image_url,
  stock = EXCLUDED.stock,
  features = EXCLUDED.features,
  rating = EXCLUDED.rating,
  reviews = EXCLUDED.reviews,
  deleted_at = NULL,  -- Reativar se estava deletado
  updated_at = now();

-- ============================================================================
-- 4. VERIFICAÇÃO
-- ============================================================================

-- Mostrar produtos inseridos
SELECT 
  id,
  name,
  price,
  stock,
  rating,
  reviews,
  created_at
FROM products
WHERE name IN (
  'Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo', 
  'Brasil', 'Argentina', 'Real Madrid', 'Barcelona', 'PSG',
  'Santos', 'Grêmio', 'Internacional', 'Atlético Mineiro',
  'Cruzeiro', 'Vasco', 'Botafogo'
)
ORDER BY 
  CASE name
    WHEN 'Flamengo' THEN 1
    WHEN 'Corinthians' THEN 2
    WHEN 'Palmeiras' THEN 3
    WHEN 'São Paulo' THEN 4
    WHEN 'Brasil' THEN 5
    WHEN 'Argentina' THEN 6
    WHEN 'Real Madrid' THEN 7
    WHEN 'Barcelona' THEN 8
    WHEN 'PSG' THEN 9
    WHEN 'Santos' THEN 10
    WHEN 'Grêmio' THEN 11
    WHEN 'Internacional' THEN 12
    WHEN 'Atlético Mineiro' THEN 13
    WHEN 'Cruzeiro' THEN 14
    WHEN 'Vasco' THEN 15
    WHEN 'Botafogo' THEN 16
  END;

-- Contar produtos por categoria
SELECT 
  c.name as categoria,
  COUNT(p.id) as total_produtos,
  SUM(p.stock) as estoque_total
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
GROUP BY c.id, c.name
ORDER BY c.name;

-- Mostrar resumo
SELECT 
  '✅ SEED COMPLETO' as status,
  COUNT(*) as produtos_inseridos,
  SUM(stock) as estoque_total,
  ROUND(AVG(price), 2) as preco_medio,
  ROUND(AVG(rating), 2) as rating_medio
FROM products
WHERE name IN (
  'Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo', 
  'Brasil', 'Argentina', 'Real Madrid', 'Barcelona', 'PSG',
  'Santos', 'Grêmio', 'Internacional', 'Atlético Mineiro',
  'Cruzeiro', 'Vasco', 'Botafogo'
)
  AND deleted_at IS NULL;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. IMAGENS: As URLs de imagem são placeholders. Você precisará:
--    - Adicionar as imagens reais em /public/products/
--    - Ou atualizar as URLs para apontar para CDN/storage
--
-- 2. ESTOQUE:
--    - Brasileiros: 8-15 unidades (estoque saudável)
--    - Seleções: 4-10 unidades (estoque moderado)
--    - Europeus: 3-5 unidades (estoque limitado)
--
-- 3. PREÇOS:
--    - Brasileiros: R$ 279,90 - R$ 299,90
--    - Seleções: R$ 349,90
--    - Europeus: R$ 399,90
--
-- 4. RATINGS: Todos entre 4.6 e 5.0 (produtos de qualidade)
--
-- 5. FEATURES: Todos incluem tecnologia Dri-FIT e materiais premium
--
-- 6. LIMPEZA E RE-EXECUÇÃO: O script primeiro deleta produtos existentes
--    com os mesmos nomes, depois insere novamente. Isso garante que você
--    pode executar o script múltiplas vezes sem erros de duplicação.
--
-- ============================================================================
