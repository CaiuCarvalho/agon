# Fix: Imagens de Produtos 404

## Problema Identificado

✅ **Navegação está funcionando perfeitamente!**

❌ **Problema real**: Imagens de produtos retornando 404

### Causa Raiz
- Banco de dados tem 16 produtos (Flamengo, Corinthians, Real Madrid, etc.)
- Cada produto referencia uma imagem específica (ex: `/products/flamengo.jpg`)
- Apenas 6 imagens genéricas existem no diretório `apps/web/public/products/`:
  - `product-ball.jpg`
  - `product-jersey.jpg`
  - `product-scarf.jpg`
  - `product-shorts.jpg`
  - `product-cap.jpg`
  - `product-bag.jpg`

## Solução Aplicada

Criada migration que atualiza todos os produtos para usar a imagem genérica de camisa (`product-jersey.jpg`).

## Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **New Query**
5. Copie o conteúdo do arquivo:
   ```
   supabase/migrations/20260411000001_fix_product_images_use_generic.sql
   ```
6. Cole no editor
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Verifique os resultados na aba de resultados

### Opção 2: Via CLI do Supabase (se tiver configurado)

```bash
# Aplicar migration
supabase db push

# Ou aplicar manualmente
supabase db execute -f supabase/migrations/20260411000001_fix_product_images_use_generic.sql
```

## Verificação

Após aplicar a migration:

1. **Recarregue a página** no browser (Ctrl+R ou F5)
2. **Verifique o console** (F12 → Console)
3. **Não deve mais aparecer** erros 404 de imagens de produtos
4. **Todos os produtos** devem mostrar a imagem genérica de camisa

### Query de Verificação (opcional)

Execute no SQL Editor do Supabase:

```sql
-- Ver todos os produtos e suas imagens
SELECT 
  name,
  image_url,
  stock,
  price
FROM products
WHERE deleted_at IS NULL
ORDER BY name;

-- Contar produtos por imagem
SELECT 
  image_url,
  COUNT(*) as total
FROM products
WHERE deleted_at IS NULL
GROUP BY image_url;
```

**Resultado esperado**: Todos os produtos devem ter `image_url = '/products/product-jersey.jpg'`

## Próximos Passos (Opcional)

Se quiser adicionar imagens específicas dos times no futuro:

### 1. Adicionar Imagens

Coloque as imagens em `apps/web/public/products/`:
- `flamengo.jpg`
- `corinthians.jpg`
- `palmeiras.jpg`
- etc.

### 2. Atualizar Banco de Dados

Execute no SQL Editor:

```sql
-- Exemplo: Atualizar imagem do Flamengo
UPDATE products 
SET image_url = '/products/flamengo.jpg' 
WHERE name = 'Flamengo';

-- Exemplo: Atualizar múltiplos produtos
UPDATE products 
SET image_url = CASE name
  WHEN 'Flamengo' THEN '/products/flamengo.jpg'
  WHEN 'Corinthians' THEN '/products/corinthians.jpg'
  WHEN 'Palmeiras' THEN '/products/palmeiras.jpg'
  WHEN 'São Paulo' THEN '/products/sao-paulo.jpg'
  WHEN 'Brasil' THEN '/products/brasil.jpg'
  WHEN 'Argentina' THEN '/products/argentina.jpg'
  WHEN 'Real Madrid' THEN '/products/real-madrid.jpg'
  WHEN 'Barcelona' THEN '/products/barcelona.jpg'
  WHEN 'PSG' THEN '/products/psg.jpg'
  ELSE image_url
END
WHERE name IN (
  'Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo',
  'Brasil', 'Argentina', 'Real Madrid', 'Barcelona', 'PSG'
);
```

## Resumo

- ✅ **Navegação**: Funcionando perfeitamente
- ✅ **Fast Refresh**: Funcionando (Hot Module Replacement)
- ✅ **Servidor**: Rodando corretamente na porta 3000
- ✅ **Imagens**: Serão corrigidas após aplicar a migration
- ⚠️ **CSS Warnings**: Normais em desenvolvimento, não afetam funcionalidade

## Comandos Úteis

```bash
# Limpar cache do Next.js (se necessário)
rm -rf apps/web/.next
rm -rf .turbo

# Reiniciar servidor
npm run dev

# Verificar porta 3000
netstat -ano | findstr :3000
```

## Suporte

Se após aplicar a migration ainda houver problemas:

1. Limpe o cache do browser (Ctrl+Shift+Delete)
2. Faça hard refresh (Ctrl+Shift+R)
3. Verifique o console do browser (F12)
4. Verifique se a migration foi aplicada com sucesso no Supabase
