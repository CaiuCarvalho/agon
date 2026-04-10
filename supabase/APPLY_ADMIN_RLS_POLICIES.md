# Aplicar Políticas RLS do Painel Admin

Este guia explica como aplicar as políticas de Row Level Security (RLS) para o painel administrativo.

## ⚠️ Importante

As políticas RLS são a **ÚLTIMA LINHA DE DEFESA**. A validação primária acontece no backend (API routes). As políticas RLS garantem que mesmo se o backend falhar, o banco de dados ainda protegerá os dados.

## Pré-requisitos

1. Migrations do admin panel aplicadas (`20250409_admin_panel_shipping_fields.sql` e `20250409_update_webhook_rpc_atomic.sql`)
2. Usuários admin criados com `role='admin'` na tabela `profiles`

## Aplicar Políticas

### Via SQL Editor (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá para: SQL Editor
3. Copie e cole o conteúdo de: `supabase/migrations/20250409_admin_panel_rls_policies.sql`
4. Clique em "Run"

### Via CLI do Supabase

```bash
supabase db push
```

## Políticas Criadas

### Products Table
- ✅ `admin_select_products` - Admin pode ver todos os produtos (incluindo deletados)
- ✅ `admin_insert_products` - Admin pode criar produtos
- ✅ `admin_update_products` - Admin pode atualizar produtos
- ✅ `admin_delete_products` - Admin pode deletar produtos

### Orders Table
- ✅ `admin_select_orders` - Admin pode ver todos os pedidos
- ✅ `admin_update_orders` - Admin pode atualizar informações de envio

### Order_Items Table
- ✅ `admin_select_order_items` - Admin pode ver itens dos pedidos

### Payments Table
- ✅ `admin_select_payments` - Admin pode ver informações de pagamento

## Verificar Políticas

Execute no SQL Editor:

\`\`\`sql
-- Ver todas as políticas de admin
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
WHERE policyname LIKE 'admin_%'
ORDER BY tablename, policyname;
\`\`\`

Você deve ver 10 políticas no total.

## Testar Políticas

### Teste 1: Admin pode acessar produtos

\`\`\`sql
-- Conecte como usuário admin
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-user-id"}';

-- Deve retornar produtos
SELECT * FROM products LIMIT 5;
\`\`\`

### Teste 2: Não-admin não pode acessar

\`\`\`sql
-- Conecte como usuário regular
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "regular-user-id"}';

-- Deve retornar vazio (não erro)
SELECT * FROM products LIMIT 5;
\`\`\`

### Teste 3: Admin pode ver pedidos

\`\`\`sql
-- Como admin
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-user-id"}';

-- Deve retornar pedidos
SELECT * FROM orders LIMIT 5;
\`\`\`

## Comportamento das Políticas

### Quando Violadas
- **SELECT**: Retorna conjunto vazio (não erro)
- **INSERT/UPDATE/DELETE**: Operação falha silenciosamente
- Logs não são gerados automaticamente

### Camadas de Segurança

1. **Backend Validation** (Primária)
   - Valida em todos os endpoints da API
   - Retorna 401/403 com mensagem de erro
   - Loga tentativas de acesso não autorizado

2. **RLS Policies** (Última Defesa)
   - Protege se backend falhar
   - Retorna conjunto vazio
   - Não gera logs automáticos

3. **Frontend Guard** (Apenas UX)
   - Redireciona usuários
   - Melhora experiência
   - Não é segurança

## Troubleshooting

### Políticas não estão funcionando

**Verifique:**
1. RLS está habilitado nas tabelas?
   \`\`\`sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('products', 'orders', 'order_items', 'payments');
   \`\`\`

2. Usuário tem role='admin'?
   \`\`\`sql
   SELECT id, email, role FROM profiles WHERE role = 'admin';
   \`\`\`

3. Políticas foram criadas?
   \`\`\`sql
   SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE 'admin_%';
   \`\`\`

### Admin não consegue acessar dados

**Possíveis causas:**
1. Role não é 'admin' na tabela profiles
2. Políticas não foram aplicadas
3. RLS não está habilitado
4. Usuário não está autenticado

**Solução:**
\`\`\`sql
-- Verificar role
SELECT id, email, role FROM profiles WHERE email = 'admin@example.com';

-- Atualizar se necessário
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
\`\`\`

### Conflito com políticas existentes

Se você já tem políticas RLS para usuários regulares, as políticas de admin são **aditivas**. Elas não substituem as existentes.

**Exemplo:**
- Usuário regular: Pode ver apenas seus próprios pedidos
- Admin: Pode ver TODOS os pedidos

Ambas as políticas coexistem.

## Remover Políticas (se necessário)

\`\`\`sql
-- Products
DROP POLICY IF EXISTS "admin_select_products" ON products;
DROP POLICY IF EXISTS "admin_insert_products" ON products;
DROP POLICY IF EXISTS "admin_update_products" ON products;
DROP POLICY IF EXISTS "admin_delete_products" ON products;

-- Orders
DROP POLICY IF EXISTS "admin_select_orders" ON orders;
DROP POLICY IF EXISTS "admin_update_orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "admin_select_order_items" ON order_items;

-- Payments
DROP POLICY IF EXISTS "admin_select_payments" ON payments;
\`\`\`

## Próximos Passos

Após aplicar as políticas:

1. Teste o painel admin em: `http://localhost:3000/admin`
2. Verifique que admin pode acessar tudo
3. Verifique que não-admin é bloqueado
4. Monitore logs para tentativas de acesso não autorizado

## Segurança em Produção

Antes de fazer deploy:

1. ✅ Aplicar todas as migrations
2. ✅ Aplicar políticas RLS
3. ✅ Criar usuários admin
4. ✅ Configurar variáveis de ambiente
5. ✅ Testar acesso admin
6. ✅ Testar bloqueio de não-admin
7. ✅ Verificar logs

## Suporte

Para problemas:
1. Verifique os logs do Supabase
2. Execute os testes de verificação acima
3. Consulte `ADMIN-PANEL-SETUP.md`
4. Revise o design em `.kiro/specs/admin-panel-mvp/design.md`
