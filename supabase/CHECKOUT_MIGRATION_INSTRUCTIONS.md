# Instruções para Aplicar Migrations do Checkout

## ⚠️ IMPORTANTE: Pré-requisitos

Antes de aplicar as migrations do checkout, você precisa ter a tabela `products` criada no banco de dados.

### Verificar se a tabela products existe

Execute esta query no SQL Editor:

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'products'
) as products_exists;
```

- Se retornar `true`: ✅ Pode prosseguir para o passo 1
- Se retornar `false`: ❌ Precisa aplicar o schema de produtos primeiro

### Se products não existir, aplique primeiro:

1. Abra o arquivo `supabase-product-catalog-schema.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor e execute
4. Aguarde a conclusão (deve criar categories e products)
5. Depois volte para estas instruções

## 📋 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione o projeto **Agon**

### 2. Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New Query** para criar uma nova query

### 3. Executar as Migrations do Checkout

1. Abra o arquivo `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### 4. Verificar Sucesso

Após executar, você deve ver:

✅ **Mensagens de sucesso:**
```
NOTICE: ✅ All checkout migrations applied successfully!
NOTICE: 📋 Tables created: orders, order_items
NOTICE: 🔒 RLS policies enabled and configured
NOTICE: ⚡ RPC function created: create_order_atomic
```

✅ **Resultados das queries de validação:**

**Tabelas criadas:**
```
schemaname | tablename    | tableowner
-----------+--------------+-----------
public     | order_items  | postgres
public     | orders       | postgres
```

**RLS habilitado:**
```
schemaname | tablename    | rls_enabled
-----------+--------------+------------
public     | order_items  | true
public     | orders       | true
```

**Policies criadas:**
```
tablename    | policyname                  | cmd
-------------+-----------------------------+--------
order_items  | order_items_delete_admin    | DELETE
order_items  | order_items_insert_own      | INSERT
order_items  | order_items_select_own      | SELECT
order_items  | order_items_update_admin    | UPDATE
orders       | orders_delete_admin         | DELETE
orders       | orders_insert_own           | INSERT
orders       | orders_select_own           | SELECT
orders       | orders_update_own_or_admin  | UPDATE
```

**Função RPC criada:**
```
function_name        | arguments                                    | return_type
---------------------+----------------------------------------------+------------
create_order_atomic  | p_user_id uuid, p_shipping_name text, ...    | jsonb
```

## 🧪 Testar a Função RPC

Após aplicar as migrations, você pode testar a função RPC com esta query:

```sql
-- Primeiro, adicione um item ao carrinho (substitua os UUIDs pelos seus)
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES (
  'seu-user-id-aqui',
  'seu-product-id-aqui',
  1,
  'M',
  99.90,
  'Produto Teste'
);

-- Depois, teste a criação do pedido
SELECT create_order_atomic(
  'seu-user-id-aqui'::uuid,
  'João Silva',
  'Rua Brasil, 100',
  'São Paulo',
  'SP',
  '01234-567',
  '(11) 98765-4321',
  'joao@example.com',
  'cash_on_delivery'
);
```

**Resultado esperado:**
```json
{
  "success": true,
  "order_id": "uuid-do-pedido",
  "total_amount": 99.90,
  "item_count": 1
}
```

## ❌ Troubleshooting

### Erro: "relation 'products' does not exist"

A tabela products não foi criada ainda. Você precisa:

1. **Aplicar o schema de produtos primeiro:**
   - Abra o arquivo `supabase-product-catalog-schema.sql`
   - Copie todo o conteúdo
   - Execute no SQL Editor
   - Aguarde a conclusão

2. **Depois execute o APPLY_CHECKOUT_MIGRATIONS.sql novamente**

### Erro: "relation already exists"

Se você ver este erro, as tabelas já existem. Você pode:

1. **Verificar se já foram criadas:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items');
```

2. **Dropar e recriar (APENAS EM DESENVOLVIMENTO!):**
```sql
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
-- Depois execute o APPLY_CHECKOUT_MIGRATIONS.sql novamente
```

### Erro: "permission denied"

Certifique-se de que está logado com uma conta que tem permissões de admin no projeto.

### Erro: "function already exists"

A função já foi criada. Você pode:

1. **Verificar se existe:**
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'create_order_atomic';
```

2. **Dropar e recriar:**
```sql
DROP FUNCTION IF EXISTS create_order_atomic;
-- Depois execute o APPLY_CHECKOUT_MIGRATIONS.sql novamente
```

## ✅ Próximos Passos

Após aplicar as migrations com sucesso:

1. ✅ Volte para o chat e confirme que as migrations foram aplicadas
2. ✅ Continuarei com a implementação dos services layer (TypeScript)
3. ✅ Depois implementarei os hooks e componentes UI

## 📝 Notas Importantes

- As migrations são **idempotentes** - podem ser executadas múltiplas vezes sem causar erros
- As policies RLS garantem que usuários só vejam seus próprios pedidos
- A função `create_order_atomic` é **atômica** - ou tudo funciona ou nada é salvo
- O carrinho é limpo automaticamente após criar o pedido com sucesso

