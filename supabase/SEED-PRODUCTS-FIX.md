# Correção do Seed de Produtos

## Problema Identificado

O seed original usava `DELETE FROM products` que violava foreign keys:
- `order_items.product_id` → `products.id`
- `cart_items.product_id` → `products.id`  
- `wishlist_items.product_id` → `products.id`

**Erro**: `update or delete on table "products" violates foreign key constraint`

## Solução Aplicada: Soft Delete

### Mudanças Feitas:

**1. Soft Delete ao invés de Hard Delete**
```sql
-- ANTES (causava erro)
DELETE FROM products WHERE name IN (...);

-- DEPOIS (preserva histórico)
UPDATE products 
SET deleted_at = now() 
WHERE name IN (...)
AND deleted_at IS NULL;
```

**2. ON CONFLICT Corrigido**
```sql
-- ANTES (não funcionava - id é gerado automaticamente)
ON CONFLICT (id) DO NOTHING;

-- DEPOIS (usa name como chave única)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  ...
  deleted_at = NULL,  -- Reativa se estava deletado
  updated_at = now();
```

## Benefícios

✅ **Preserva histórico de pedidos** - Não quebra foreign keys  
✅ **Permite re-execução** - Script pode rodar múltiplas vezes  
✅ **Reativa produtos deletados** - Se produto existia, é atualizado  
✅ **Consistente com o app** - Queries já filtram `deleted_at IS NULL`

## Como Usar

1. Abra Supabase Dashboard → SQL Editor
2. Copie o conteúdo de `supabase/seed-products.sql`
3. Execute no SQL Editor
4. Verifique os resultados na seção de verificação

## Verificação

O script mostra automaticamente:
- ✅ Produtos inseridos/atualizados
- ✅ Estoque total por categoria
- ✅ Resumo geral (16 produtos, preço médio, rating médio)

## Nota Importante

Se você quiser **realmente deletar** produtos antigos (e perder histórico de pedidos), use:

```sql
-- ATENÇÃO: Isso apaga pedidos, carrinhos e wishlists!
WITH target_products AS (
  SELECT id FROM products WHERE name IN (...)
)
DELETE FROM order_items WHERE product_id IN (SELECT id FROM target_products);
DELETE FROM cart_items WHERE product_id IN (SELECT id FROM target_products);
DELETE FROM wishlist_items WHERE product_id IN (SELECT id FROM target_products);
DELETE FROM products WHERE id IN (SELECT id FROM target_products);
```

**Mas não recomendamos** - soft delete é mais seguro!
