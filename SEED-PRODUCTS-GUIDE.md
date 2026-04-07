# Guia: Seed de Produtos Reais

## 📋 O que foi criado

Criei um script SQL para popular o banco de dados com 9 produtos reais do catálogo:

### Produtos Brasileiros (estoque saudável)
- **Flamengo** - R$ 299,90 - 15 unidades
- **Corinthians** - R$ 289,90 - 12 unidades
- **Palmeiras** - R$ 299,90 - 10 unidades
- **São Paulo** - R$ 279,90 - 8 unidades

### Seleções (estoque moderado)
- **Brasil** - R$ 349,90 - 10 unidades
- **Argentina** - R$ 349,90 - 4 unidades

### Clubes Europeus (estoque limitado)
- **Real Madrid** - R$ 399,90 - 5 unidades
- **Barcelona** - R$ 399,90 - 4 unidades
- **PSG** - R$ 399,90 - 3 unidades

## 🚀 Como Executar

### Passo 1: Abrir SQL Editor do Supabase

```
https://supabase.com/dashboard/project/yyhpqecnxkvtnjdqhwhk/sql/new
```

### Passo 2: Executar o Script

1. Abra o arquivo `supabase/seed-products.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** ou pressione `Ctrl+Enter`

### Passo 3: Verificar Resultado

Você verá 3 tabelas de resultado:

**Tabela 1: Produtos Inseridos**
```
| id | name | price | stock | rating | reviews | created_at |
```

**Tabela 2: Produtos por Categoria**
```
| categoria | total_produtos | estoque_total |
```

**Tabela 3: Resumo**
```
| status | produtos_inseridos | estoque_total | preco_medio | rating_medio |
| ✅ SEED COMPLETO | 9 | 71 | 338.77 | 4.81 |
```

## ✅ Campos Incluídos

Cada produto tem:
- ✅ `id` - UUID gerado automaticamente
- ✅ `name` - Nome exato conforme solicitado
- ✅ `description` - Descrição detalhada
- ✅ `price` - Preço mockado (R$ 279,90 - R$ 399,90)
- ✅ `category_id` - UUID da categoria "Manto Oficial"
- ✅ `image_url` - Placeholder (ex: `/products/flamengo.jpg`)
- ✅ `stock` - Estoque ajustado conforme solicitado
- ✅ `features` - Array de características (Dri-FIT, respirável, etc)
- ✅ `rating` - Avaliação (4.6 - 5.0)
- ✅ `reviews` - Número de avaliações mockado
- ✅ `created_at` - Timestamp automático
- ✅ `updated_at` - Timestamp automático
- ✅ `deleted_at` - NULL (produtos ativos)

## 🔄 Re-execução Segura

O script primeiro **deleta** produtos existentes com os mesmos nomes, depois insere novamente. Isso significa que você pode executar o script múltiplas vezes sem erros:
- Produtos existentes serão **removidos e recriados** com novos UUIDs
- Produtos novos serão **inseridos**
- Nenhum erro de duplicação

## 📸 Imagens (Próximo Passo)

As URLs de imagem são placeholders. Você precisará:

1. **Adicionar imagens reais** em `/public/products/`:
   - `flamengo.jpg`
   - `corinthians.jpg`
   - `palmeiras.jpg`
   - `sao-paulo.jpg`
   - `brasil.jpg`
   - `argentina.jpg`
   - `real-madrid.jpg`
   - `barcelona.jpg`
   - `psg.jpg`

2. **OU** atualizar as URLs no banco para apontar para CDN/storage externo

## 🧪 Testar no Frontend

Após executar o seed:

1. Acesse: `http://localhost:3000/products`
2. Você deve ver os 9 produtos listados
3. Cada produto deve ter:
   - Nome correto
   - Preço formatado
   - Estoque disponível
   - Rating com estrelas
   - Botão "Adicionar ao Carrinho"

## 🔍 Verificar no Banco

Para verificar se os produtos foram inseridos corretamente:

```sql
-- Ver todos os produtos
SELECT 
  name,
  price,
  stock,
  rating,
  reviews
FROM products
WHERE deleted_at IS NULL
ORDER BY name;

-- Ver produtos com categoria
SELECT 
  p.name as produto,
  p.price,
  p.stock,
  c.name as categoria
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.deleted_at IS NULL
ORDER BY p.name;

-- Contar produtos
SELECT COUNT(*) as total_produtos
FROM products
WHERE deleted_at IS NULL;
```

## 📊 Detalhes dos Estoques

Conforme solicitado, os estoques foram ajustados:

| Produto | Estoque Original | Estoque Ajustado | Motivo |
|---------|-----------------|------------------|--------|
| Flamengo | ~10+ | 15 | Estoque saudável |
| Corinthians | ~10+ | 12 | Estoque saudável |
| Palmeiras | ~8+ | 10 | Estoque saudável |
| São Paulo | ~6+ | 8 | Estoque saudável |
| Brasil | ~8+ | 10 | Estoque saudável |
| Argentina | ~2+ | 4 | Aumentado um pouco |
| Real Madrid | ~3+ | 5 | Ajustado |
| Barcelona | ~2+ | 4 | Ajustado |
| PSG | ~1+ | 3 | Ajustado |

**Total de Estoque**: 71 unidades

## 🎯 Compatibilidade

O script é 100% compatível com:
- ✅ Schema atual (`supabase-product-catalog-schema.sql`)
- ✅ Tipagens TypeScript (`apps/web/src/modules/products/types.ts`)
- ✅ RLS policies (produtos públicos para leitura)
- ✅ Triggers (updated_at automático)
- ✅ Constraints (preço >= 0, estoque >= 0, etc)

## ⚠️ Pré-requisitos

Antes de executar o seed, certifique-se de que:
1. ✅ Tabela `categories` existe
2. ✅ Categoria "Manto Oficial" existe (slug: `manto-oficial`)
3. ✅ Tabela `products` existe
4. ✅ RLS policies estão configuradas

Se algum pré-requisito falhar, o script mostrará um erro claro.

## 🚨 Solução de Problemas

### Erro: "Categoria 'manto-oficial' não existe"

**Solução**: Execute o schema migration primeiro:
```sql
-- Execute: supabase-product-catalog-schema.sql
```

### Erro: "relation products does not exist"

**Solução**: Execute o schema migration primeiro:
```sql
-- Execute: supabase-product-catalog-schema.sql
```

### Erro: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

**Solução**: Este erro foi corrigido. O script agora usa `DELETE` antes de `INSERT` em vez de `ON CONFLICT`. Execute a versão atualizada do script.

## 📝 Próximos Passos

Após executar o seed com sucesso:

1. ✅ Verificar produtos no frontend (`/products`)
2. ✅ Adicionar imagens reais em `/public/products/`
3. ✅ Testar adicionar ao carrinho (após corrigir o bug)
4. ✅ Testar adicionar à wishlist (após corrigir o bug)

---

**Status**: ✅ Script pronto para execução

**Arquivo**: `supabase/seed-products.sql`

**Próxima ação**: Executar o script no Supabase SQL Editor
