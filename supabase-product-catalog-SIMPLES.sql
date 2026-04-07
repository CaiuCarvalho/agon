-- Product Catalog Schema - VERSÃO SIMPLIFICADA
-- Execute este script no Supabase SQL Editor

-- ============================================================================
-- 1. CRIAR FUNÇÃO DE TRIGGER (se não existir)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CRIAR TABELA DE CATEGORIAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) > 0 AND char_length(slug) <= 100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index para busca por slug
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Leitura pública
DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. CRIAR TABELA DE PRODUTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) > 0 AND char_length(description) <= 2000),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  image_url TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  features TEXT[] DEFAULT '{}',
  rating DECIMAL(2, 1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews INTEGER DEFAULT 0 CHECK (reviews >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ NULL
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Leitura pública (apenas produtos não deletados)
DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (deleted_at IS NULL);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. INSERIR CATEGORIAS PADRÃO
-- ============================================================================

INSERT INTO categories (name, slug, description) VALUES
  ('Manto Oficial', 'manto-oficial', 'Camisas oficiais da Seleção Brasileira'),
  ('Equipamentos', 'equipamentos', 'Equipamentos esportivos e acessórios de treino'),
  ('Lifestyle', 'lifestyle', 'Produtos casuais e de estilo de vida'),
  ('Cuidados', 'cuidados', 'Produtos de cuidados pessoais e bem-estar')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 5. INSERIR PRODUTOS DE TESTE
-- ============================================================================

-- Produto 1: Manto Titular
INSERT INTO products (name, description, price, category_id, image_url, stock, features, rating, reviews)
SELECT 
  'Manto Titular 24/25 I',
  'Camisa oficial da Seleção Brasileira para a temporada 2024/2025. Tecnologia Dri-FIT para máximo conforto e performance.',
  349.90,
  id,
  '/images/products/product-jersey.jpg',
  50,
  ARRAY['Tecnologia Dri-FIT', 'Escudo bordado', 'Tecido respirável', 'Corte anatômico'],
  4.8,
  127
FROM categories WHERE slug = 'manto-oficial'
ON CONFLICT DO NOTHING;

-- Produto 2: Jaqueta Anthem
INSERT INTO products (name, description, price, category_id, image_url, stock, features, rating, reviews)
SELECT 
  'Jaqueta Anthem Brasil',
  'Jaqueta oficial de apresentação da Seleção Brasileira. Design moderno com tecnologia corta-vento.',
  499.90,
  id,
  '/images/products/product-scarf.jpg',
  30,
  ARRAY['Corta-vento', 'Capuz ajustável', 'Bolsos laterais', 'Zíper YKK'],
  4.6,
  89
FROM categories WHERE slug = 'lifestyle'
ON CONFLICT DO NOTHING;

-- Produto 3: Shorts Oficial
INSERT INTO products (name, description, price, category_id, image_url, stock, features, rating, reviews)
SELECT 
  'Shorts Oficial Strike',
  'Shorts de treino oficial da CBF. Tecido leve e respirável para máxima mobilidade.',
  199.90,
  id,
  '/images/products/product-shorts.jpg',
  75,
  ARRAY['Elástico na cintura', 'Bolsos laterais', 'Tecido leve', 'Secagem rápida'],
  4.7,
  156
FROM categories WHERE slug = 'equipamentos'
ON CONFLICT DO NOTHING;

-- Produto 4: Bola Profissional
INSERT INTO products (name, description, price, category_id, image_url, stock, features, rating, reviews)
SELECT 
  'Bola Profissional CBF',
  'Bola oficial de treino da Seleção Brasileira. Aprovada pela FIFA para uso profissional.',
  149.90,
  id,
  '/images/products/product-ball.jpg',
  100,
  ARRAY['Tamanho oficial', 'Costura reforçada', 'Aprovada pela FIFA', 'Câmara de butyl'],
  4.9,
  234
FROM categories WHERE slug = 'equipamentos'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. VERIFICAÇÃO
-- ============================================================================

-- Verificar categorias criadas
SELECT 'Categorias criadas:' as info, COUNT(*) as total FROM categories;
SELECT id, name, slug FROM categories ORDER BY name;

-- Verificar produtos criados
SELECT 'Produtos criados:' as info, COUNT(*) as total FROM products;
SELECT id, name, price, stock FROM products ORDER BY name;

-- ============================================================================
-- ✅ MIGRATION COMPLETA!
-- ============================================================================
