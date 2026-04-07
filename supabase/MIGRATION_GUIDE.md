# Supabase Migration Guide

Este guia explica como aplicar as migrations do banco de dados Supabase e validar que todas as tabelas, constraints e índices foram criados corretamente.

## Pré-requisitos

- Supabase CLI instalado (`npm install -g supabase`)
- Projeto Supabase configurado
- Credenciais de acesso ao projeto (URL e Service Role Key)

## Método 1: Aplicar Migrations via Supabase CLI (Recomendado)

### 1.1 Configurar Supabase CLI

Se ainda não configurou o Supabase CLI, execute:

```bash
# Login no Supabase
supabase login

# Link ao seu projeto (substitua com seu project-id)
supabase link --project-ref <your-project-id>
```

### 1.2 Aplicar Migrations

Execute o comando para aplicar todas as migrations pendentes:

```bash
# Aplicar migrations ao banco de dados remoto
supabase db push

# Ou, se preferir aplicar migrations específicas:
supabase db push --include-all
```

**Saída esperada:**
```
Applying migration 20260404000001_create_cart_items_table.sql...
Applying migration 20260404000002_create_wishlist_items_table.sql...
Applying migration 20260404000003_create_wishlist_limit_trigger.sql...
Applying migration 20260404000004_create_cart_migration_rpc.sql...
Applying migration 20260404000005_create_wishlist_migration_rpc.sql...
Applying migration 20260404000006_create_add_to_cart_atomic_rpc.sql...
Applying migration 20260404000007_add_cart_items_cross_field_constraints.sql...
Finished supabase db push.
```

### 1.3 Verificar Status das Migrations

Para verificar quais migrations já foram aplicadas:

```bash
supabase migration list
```

## Método 2: Aplicar Migrations via Supabase Dashboard

### 2.1 Acessar SQL Editor

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Navegue para **SQL Editor** no menu lateral

### 2.2 Executar Migrations Manualmente

Execute cada arquivo de migration na ordem correta:

1. `20260404000001_create_cart_items_table.sql`
2. `20260404000002_create_wishlist_items_table.sql`
3. `20260404000003_create_wishlist_limit_trigger.sql`
4. `20260404000004_create_cart_migration_rpc.sql`
5. `20260404000005_create_wishlist_migration_rpc.sql`
6. `20260404000006_create_add_to_cart_atomic_rpc.sql`
7. `20260404000007_add_cart_items_cross_field_constraints.sql`

Para cada arquivo:
- Copie o conteúdo do arquivo SQL
- Cole no SQL Editor
- Clique em **Run** ou pressione `Ctrl+Enter`
- Verifique que não há erros na saída

## Validação das Migrations

Após aplicar as migrations, execute as queries de validação abaixo para garantir que tudo foi criado corretamente.

### 3.1 Validar que Tabelas Foram Criadas

Execute no SQL Editor:

```sql
-- Listar todas as tabelas criadas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('cart_items', 'wishlist_items')
ORDER BY tablename;
```

**Resultado esperado:**
```
schemaname | tablename       | tableowner
-----------+-----------------+-----------
public     | cart_items      | postgres
public     | wishlist_items  | postgres
```

### 3.2 Validar que RLS Está Ativo

Execute no SQL Editor:

```sql
-- Verificar se RLS está habilitado nas tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('cart_items', 'wishlist_items')
ORDER BY tablename;
```

**Resultado esperado:**
```
schemaname | tablename       | rls_enabled
-----------+-----------------+------------
public     | cart_items      | true
public     | wishlist_items  | true
```

### 3.3 Validar que Constraints Estão Ativos

Execute no SQL Editor:

```sql
-- Listar todos os constraints das tabelas
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('cart_items', 'wishlist_items')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
```

**Resultado esperado (cart_items):**
```
table_name  | constraint_name                      | constraint_type | check_clause
------------+--------------------------------------+-----------------+----------------------------------
cart_items  | cart_items_pkey                      | PRIMARY KEY     | NULL
cart_items  | cart_items_product_id_fkey           | FOREIGN KEY     | NULL
cart_items  | cart_items_user_id_fkey              | FOREIGN KEY     | NULL
cart_items  | unique_cart_item                     | UNIQUE          | NULL
cart_items  | cart_items_price_snapshot_check      | CHECK           | (price_snapshot > 0)
cart_items  | cart_items_product_name_snapshot_... | CHECK           | (product_name_snapshot <> '')
cart_items  | cart_items_quantity_check            | CHECK           | (quantity >= 1 AND quantity <= 99)
cart_items  | cart_items_size_check                | CHECK           | (char_length(size) > 0 AND ...)
cart_items  | valid_timestamps                     | CHECK           | (created_at <= updated_at)
cart_items  | valid_total                          | CHECK           | (quantity * price_snapshot <= ...)
```

**Resultado esperado (wishlist_items):**
```
table_name      | constraint_name                | constraint_type | check_clause
----------------+--------------------------------+-----------------+-------------
wishlist_items  | wishlist_items_pkey            | PRIMARY KEY     | NULL
wishlist_items  | wishlist_items_product_id_fkey | FOREIGN KEY     | NULL
wishlist_items  | wishlist_items_user_id_fkey    | FOREIGN KEY     | NULL
wishlist_items  | unique_wishlist_item           | UNIQUE          | NULL
```

### 3.4 Validar Foreign Keys com CASCADE DELETE

Execute no SQL Editor:

```sql
-- Verificar configuração de foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('cart_items', 'wishlist_items')
ORDER BY tc.table_name, kcu.column_name;
```

**Resultado esperado:**
```
table_name      | column_name | foreign_table_name | foreign_column_name | delete_rule
----------------+-------------+--------------------+---------------------+------------
cart_items      | product_id  | products           | id                  | CASCADE
cart_items      | user_id     | users              | id                  | CASCADE
wishlist_items  | product_id  | products           | id                  | CASCADE
wishlist_items  | user_id     | users              | id                  | CASCADE
```

### 3.5 Validar que Índices Foram Criados

Execute no SQL Editor:

```sql
-- Listar todos os índices das tabelas
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('cart_items', 'wishlist_items')
ORDER BY tablename, indexname;
```

**Resultado esperado (cart_items):**
```
schemaname | tablename  | indexname                      | indexdef
-----------+------------+--------------------------------+------------------------------------------
public     | cart_items | cart_items_pkey                | CREATE UNIQUE INDEX ... USING btree (id)
public     | cart_items | idx_cart_items_product_id      | CREATE INDEX ... USING btree (product_id)
public     | cart_items | idx_cart_items_updated_at      | CREATE INDEX ... USING btree (updated_at DESC)
public     | cart_items | idx_cart_items_user_id         | CREATE INDEX ... USING btree (user_id)
public     | cart_items | unique_cart_item               | CREATE UNIQUE INDEX ... USING btree (user_id, product_id, size)
```

**Resultado esperado (wishlist_items):**
```
schemaname | tablename      | indexname                          | indexdef
-----------+----------------+------------------------------------+------------------------------------------
public     | wishlist_items | wishlist_items_pkey                | CREATE UNIQUE INDEX ... USING btree (id)
public     | wishlist_items | idx_wishlist_items_created_at      | CREATE INDEX ... USING btree (created_at DESC)
public     | wishlist_items | idx_wishlist_items_product_id      | CREATE INDEX ... USING btree (product_id)
public     | wishlist_items | idx_wishlist_items_user_id         | CREATE INDEX ... USING btree (user_id)
public     | wishlist_items | unique_wishlist_item               | CREATE UNIQUE INDEX ... USING btree (user_id, product_id)
```

### 3.6 Validar que RLS Policies Foram Criadas

Execute no SQL Editor:

```sql
-- Listar todas as policies RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cart_items', 'wishlist_items')
ORDER BY tablename, policyname;
```

**Resultado esperado (cart_items):**
```
tablename  | policyname              | permissive | roles      | cmd    | qual                      | with_check
-----------+-------------------------+------------+------------+--------+---------------------------+---------------------------
cart_items | cart_items_delete_own   | PERMISSIVE | {public}   | DELETE | (auth.uid() = user_id)    | NULL
cart_items | cart_items_insert_own   | PERMISSIVE | {public}   | INSERT | NULL                      | (auth.uid() = user_id)
cart_items | cart_items_select_own   | PERMISSIVE | {public}   | SELECT | (auth.uid() = user_id)    | NULL
cart_items | cart_items_update_own   | PERMISSIVE | {public}   | UPDATE | (auth.uid() = user_id)    | (auth.uid() = user_id)
```

**Resultado esperado (wishlist_items):**
```
tablename      | policyname                  | permissive | roles      | cmd    | qual                      | with_check
---------------+-----------------------------+------------+------------+--------+---------------------------+---------------------------
wishlist_items | wishlist_items_delete_own   | PERMISSIVE | {public}   | DELETE | (auth.uid() = user_id)    | NULL
wishlist_items | wishlist_items_insert_own   | PERMISSIVE | {public}   | INSERT | NULL                      | (auth.uid() = user_id)
wishlist_items | wishlist_items_select_own   | PERMISSIVE | {public}   | SELECT | (auth.uid() = user_id)    | NULL
```

### 3.7 Validar que Triggers Foram Criados

Execute no SQL Editor:

```sql
-- Listar todos os triggers
SELECT
  event_object_schema AS schema_name,
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('cart_items', 'wishlist_items')
ORDER BY event_object_table, trigger_name;
```

**Resultado esperado:**
```
schema_name | table_name     | trigger_name                  | event  | timing | action_statement
------------+----------------+-------------------------------+--------+--------+----------------------------------
public      | cart_items     | update_cart_items_updated_at  | UPDATE | BEFORE | EXECUTE FUNCTION update_updated_at_column()
public      | wishlist_items | enforce_wishlist_limit        | INSERT | BEFORE | EXECUTE FUNCTION check_wishlist_limit()
```

### 3.8 Validar que RPC Functions Foram Criadas

Execute no SQL Editor:

```sql
-- Listar todas as funções RPC criadas
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  CASE p.prosecdef
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'add_to_cart_atomic',
    'migrate_cart_items',
    'migrate_wishlist_items',
    'check_wishlist_limit',
    'update_updated_at_column'
  )
ORDER BY p.proname;
```

**Resultado esperado:**
```
schema_name | function_name           | arguments                                                    | return_type | security_type
------------+-------------------------+--------------------------------------------------------------+-------------+------------------
public      | add_to_cart_atomic      | p_user_id uuid, p_product_id uuid, p_quantity integer, ...   | jsonb       | SECURITY DEFINER
public      | check_wishlist_limit    |                                                              | trigger     | SECURITY DEFINER
public      | migrate_cart_items      | p_user_id uuid, p_items jsonb                                | jsonb       | SECURITY DEFINER
public      | migrate_wishlist_items  | p_user_id uuid, p_items jsonb                                | jsonb       | SECURITY DEFINER
public      | update_updated_at_column|                                                              | trigger     | SECURITY DEFINER
```

## Troubleshooting

### Erro: "relation already exists"

Se você receber este erro, significa que a tabela já foi criada. Você pode:

1. Verificar se a migration já foi aplicada: `supabase migration list`
2. Pular a migration específica ou
3. Dropar a tabela existente (CUIDADO: isso apaga dados!)

```sql
-- Apenas em ambiente de desenvolvimento!
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
```

### Erro: "permission denied"

Certifique-se de que está usando credenciais com permissões adequadas (Service Role Key ou owner do projeto).

### Erro: "function does not exist"

Se funções RPC não foram criadas, execute manualmente os arquivos de migration correspondentes:
- `20260404000003_create_wishlist_limit_trigger.sql`
- `20260404000004_create_cart_migration_rpc.sql`
- `20260404000005_create_wishlist_migration_rpc.sql`
- `20260404000006_create_add_to_cart_atomic_rpc.sql`

### Verificar Logs de Erro

Para ver logs detalhados de erros:

```bash
# Ver logs do Supabase
supabase logs

# Ver logs específicos do banco de dados
supabase logs --db
```

## Rollback de Migrations

Se precisar reverter uma migration:

```bash
# Reverter última migration
supabase db reset

# Ou criar migration de rollback manual
supabase migration new rollback_<nome_da_migration>
```

**ATENÇÃO:** Rollback em produção deve ser feito com extremo cuidado, pois pode resultar em perda de dados.

## Próximos Passos

Após validar que todas as migrations foram aplicadas com sucesso:

1. ✅ Testar operações CRUD nas tabelas via Supabase Dashboard
2. ✅ Testar RLS policies com diferentes usuários
3. ✅ Testar RPC functions (add_to_cart_atomic, migrate_cart_items, etc)
4. ✅ Configurar rate limiting (Task 4.x)
5. ✅ Implementar migration logic no frontend (Task 5.x)
6. ✅ Executar suite de testes de integração (Task 11.x)

## Recursos Adicionais

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Constraints Documentation](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Row Level Security (RLS) Guide](https://supabase.com/docs/guides/auth/row-level-security)
