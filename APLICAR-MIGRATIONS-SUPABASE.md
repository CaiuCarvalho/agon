# 🚀 Como Aplicar as Migrations no Supabase

## ❌ PROBLEMA IDENTIFICADO

O banco de dados está **VAZIO**! As tabelas não existem, por isso os componentes não aparecem.

```
✅ Conexão OK
❌ Tabela 'products' não encontrada
❌ Tabela 'categories' não encontrada
❌ 0 produtos no banco
```

## ✅ SOLUÇÃO: Aplicar Migrations

### Passo 1: Abrir Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `yyhpqecnxkvtnjdqhwhk`
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Aplicar Schema do Catálogo de Produtos

⚠️ **IMPORTANTE: Use a versão SIMPLES do arquivo!**

1. Clique em **"+ New Query"**
2. Copie TODO o conteúdo do arquivo: **`supabase-product-catalog-SIMPLES.sql`** ← USE ESTE!
3. Cole no editor SQL
4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. Aguarde a mensagem de sucesso

**Por que a versão SIMPLES?**
- ✅ Sem blocos `DO $` que causam erro de sintaxe
- ✅ Já inclui os 4 produtos de teste
- ✅ Mais fácil de executar

**O que isso cria:**
- ✅ Tabela `categories` (4 categorias padrão)
- ✅ Tabela `products` (4 produtos de teste já incluídos!)
- ✅ RLS Policies (segurança)
- ✅ Indexes (performance)
- ✅ Triggers (updated_at automático)

**Você NÃO precisa executar o Passo 4** (produtos já estão incluídos neste script!)

### Passo 3: Aplicar Migrations do Checkout (OPCIONAL)

Se quiser testar o checkout também:

1. Clique em **"+ New Query"** novamente
2. Copie TODO o conteúdo do arquivo: `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`
3. Cole no editor SQL
4. Clique em **"Run"**

**O que isso cria:**
- ✅ Tabela `orders`
- ✅ Tabela `order_items`
- ✅ RLS Policies para pedidos
- ✅ Função RPC `create_order_atomic`

### Passo 4: Popular com Produtos de Teste

⚠️ **PULE ESTE PASSO!** Os produtos já foram inseridos no script SIMPLES do Passo 2.

Se você usou o arquivo `supabase-product-catalog-schema.sql` (versão antiga), execute este SQL:

```sql
-- Inserir produtos de teste
INSERT INTO products (name, description, price, category_id, image_url, stock, features, rating, reviews) 
SELECT 
  'Manto Titular 24/25 I',
  'Camisa oficial da Seleção Brasileira para a temporada 2024/2025',
  349.90,
  id,
  '/images/products/product-jersey.jpg',
  50,
  ARRAY['Tecnologia Dri-FIT', 'Escudo bordado', 'Tecido respirável'],
  4.8,
  127
FROM categories WHERE slug = 'manto-oficial'

UNION ALL

SELECT 
  'Jaqueta Anthem Brasil',
  'Jaqueta oficial de apresentação da Seleção',
  499.90,
  id,
  '/images/products/product-scarf.jpg',
  30,
  ARRAY['Corta-vento', 'Capuz ajustável', 'Bolsos laterais'],
  4.6,
  89
FROM categories WHERE slug = 'lifestyle'

UNION ALL

SELECT 
  'Shorts Oficial Strike',
  'Shorts de treino oficial da CBF',
  199.90,
  id,
  '/images/products/product-shorts.jpg',
  75,
  ARRAY['Elástico na cintura', 'Bolsos laterais', 'Tecido leve'],
  4.7,
  156
FROM categories WHERE slug = 'equipamentos'

UNION ALL

SELECT 
  'Bola Profissional CBF',
  'Bola oficial de treino da Seleção Brasileira',
  149.90,
  id,
  '/images/products/product-ball.jpg',
  100,
  ARRAY['Tamanho oficial', 'Costura reforçada', 'Aprovada pela FIFA'],
  4.9,
  234
FROM categories WHERE slug = 'equipamentos';
```

### Passo 5: Verificar se Funcionou

Execute este comando no terminal do projeto:

```bash
npx tsx scripts/check-database.ts
```

Você deve ver:

```
✅ Conexão OK
✅ products: 4 registros
✅ categories: 4 registros
✅ 4 produtos encontrados
```

### Passo 6: Recarregar o Site

1. Pare o servidor (Ctrl+C)
2. Inicie novamente: `npm run dev`
3. Acesse: http://localhost:3000
4. **Os componentes devem aparecer agora!** 🎉

## 🔍 Verificação Rápida

Depois de aplicar as migrations, você pode verificar no Supabase Dashboard:

1. **Table Editor** > `products` → Deve ter 4 produtos
2. **Table Editor** > `categories` → Deve ter 4 categorias
3. **Authentication** > **Policies** → Deve ter policies para products e categories

## ❓ Problemas Comuns

### "Function update_updated_at_column() does not exist"

Execute primeiro:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### "Table profiles does not exist"

As RLS policies dependem da tabela `profiles`. Se ela não existir, você tem duas opções:

**Opção 1: Criar tabela profiles**
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Opção 2: Desabilitar RLS temporariamente** (NÃO RECOMENDADO EM PRODUÇÃO)
```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
```

## 📞 Precisa de Ajuda?

Se ainda não funcionar, me envie:

1. Screenshot do erro no SQL Editor
2. Output do comando: `npx tsx scripts/check-database.ts`
3. Screenshot do console do navegador (F12)
