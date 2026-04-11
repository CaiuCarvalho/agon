# Correção: Painel Admin - Navegação e Visualização de Todos os Pedidos

## 📋 Problemas Identificados

### 1. ❌ Navegação não funciona entre páginas do admin
**Causa**: Layout usando tags `<a href>` ao invés de `Link` do Next.js
**Sintoma**: Página recarrega completamente ao clicar nos links

### 2. ❌ Admin vê apenas seus próprios pedidos
**Causa**: Política RLS `orders_select_own` limita SELECT apenas ao `user_id` do usuário logado
**Sintoma**: Painel admin mostra apenas pedidos do próprio admin, não todos os pedidos do sistema

## ✅ Soluções Implementadas

### 1. Navegação Corrigida
**Arquivo**: `apps/web/src/app/admin/layout.tsx`

**Mudança**:
```typescript
// ANTES (causa reload completo)
<a href="/admin">Dashboard</a>
<a href="/admin/products">Produtos</a>
<a href="/admin/orders">Pedidos</a>

// DEPOIS (navegação SPA)
import Link from 'next/link';

<Link href="/admin">Dashboard</Link>
<Link href="/admin/products">Produtos</Link>
<Link href="/admin/orders">Pedidos</Link>
```

**Resultado**: Navegação instantânea sem recarregar a página

### 2. Políticas RLS Corrigidas
**Arquivo**: `supabase/migrations/20260411060000_add_admin_select_orders_policy.sql`

**Políticas Adicionadas**:

#### A. `orders_select_own_or_admin`
```sql
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders
  FOR SELECT
  USING (
    -- Usuário vê seus próprios pedidos
    user_id = (SELECT auth.uid())
    OR
    -- Admin vê TODOS os pedidos
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    (SELECT (raw_user_meta_data->>'role')::text 
     FROM auth.users 
     WHERE id = (SELECT auth.uid())) = 'admin'
  );
```

#### B. `order_items_select_own_or_admin`
```sql
CREATE POLICY "order_items_select_own_or_admin"
  ON public.order_items
  FOR SELECT
  USING (
    -- Usuário vê itens de seus próprios pedidos
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
    OR
    -- Admin vê TODOS os itens
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    (SELECT (raw_user_meta_data->>'role')::text 
     FROM auth.users 
     WHERE id = (SELECT auth.uid())) = 'admin'
  );
```

#### C. `payments_select_own_or_admin`
```sql
CREATE POLICY "payments_select_own_or_admin"
  ON public.payments
  FOR SELECT
  USING (
    -- Usuário vê pagamentos de seus próprios pedidos
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
    OR
    -- Admin vê TODOS os pagamentos
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    (SELECT (raw_user_meta_data->>'role')::text 
     FROM auth.users 
     WHERE id = (SELECT auth.uid())) = 'admin'
  );
```

## 🚀 Como Aplicar as Correções

### Passo 1: Aplicar Migration no Supabase

1. Abra o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo:
   ```
   supabase/migrations/20260411060000_add_admin_select_orders_policy.sql
   ```
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

**Resultado esperado**: 
```
✅ DROP POLICY
✅ CREATE POLICY orders_select_own_or_admin
✅ DROP POLICY
✅ CREATE POLICY order_items_select_own_or_admin
✅ DROP POLICY
✅ CREATE POLICY payments_select_own_or_admin
```

### Passo 2: Reiniciar o Servidor de Desenvolvimento

```bash
# Parar o servidor (Ctrl+C se estiver rodando)

# Limpar cache do Next.js (opcional mas recomendado)
rm -rf apps/web/.next

# Iniciar novamente
npm run dev
```

### Passo 3: Verificar no Navegador

1. Faça login como admin
2. Acesse http://localhost:3000/admin
3. Teste a navegação:
   - [ ] Clicar em "Dashboard" → deve navegar sem reload
   - [ ] Clicar em "Produtos" → deve navegar sem reload
   - [ ] Clicar em "Pedidos" → deve navegar sem reload
4. Verifique os pedidos:
   - [ ] Deve mostrar TODOS os pedidos do sistema
   - [ ] Não apenas os pedidos do admin logado
   - [ ] Deve incluir o pedido de teste feito por outra conta

## 🔍 Verificação das Políticas RLS

### No Supabase SQL Editor

```sql
-- 1. Verificar políticas ativas para orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 2. Verificar políticas ativas para order_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'order_items'
ORDER BY policyname;

-- 3. Verificar políticas ativas para payments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY policyname;
```

### Resultado Esperado

Você deve ver as seguintes políticas:

**orders**:
- `orders_select_own_or_admin` (SELECT)
- `orders_insert_own` (INSERT)
- `orders_update_own_or_admin` (UPDATE)
- `orders_delete_admin` (DELETE)

**order_items**:
- `order_items_select_own_or_admin` (SELECT)
- `order_items_insert_own` (INSERT)
- `order_items_update_admin` (UPDATE)
- `order_items_delete_admin` (DELETE)

**payments**:
- `payments_select_own_or_admin` (SELECT)
- `payments_insert_own` (INSERT)
- `payments_update_system_or_admin` (UPDATE)
- `payments_delete_admin` (DELETE)

## 🧪 Testes

### Teste 1: Navegação do Admin

1. Acesse `/admin`
2. Abra o DevTools (F12) → Network tab
3. Clique em "Produtos"
4. **Esperado**: Nenhum reload completo da página (apenas requisições de API)
5. **Antes**: Reload completo com `document` request

### Teste 2: Visualização de Pedidos

#### Como Usuário Normal:
1. Faça login como usuário normal (não admin)
2. Acesse `/perfil` ou página de pedidos
3. **Esperado**: Ver apenas seus próprios pedidos

#### Como Admin:
1. Faça login como admin
2. Acesse `/admin/orders`
3. **Esperado**: Ver TODOS os pedidos do sistema
4. **Deve incluir**:
   - Pedidos do próprio admin
   - Pedidos de outros usuários
   - Pedido de teste feito por outra conta

### Teste 3: Detalhes do Pedido

1. Como admin, clique em um pedido de outro usuário
2. **Esperado**: Ver todos os detalhes:
   - Informações do cliente
   - Itens do pedido
   - Informações de pagamento
   - Status de envio

## 🐛 Troubleshooting

### Problema: Navegação ainda recarrega a página

**Solução 1**: Limpar cache do Next.js
```bash
rm -rf apps/web/.next
npm run dev
```

**Solução 2**: Verificar se o import do Link está correto
```typescript
import Link from 'next/link';
```

**Solução 3**: Hard refresh no navegador (Ctrl+Shift+R)

### Problema: Admin ainda vê apenas seus próprios pedidos

**Solução 1**: Verificar se a migration foi aplicada
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'orders' 
AND policyname = 'orders_select_own_or_admin';
```

**Solução 2**: Verificar se o usuário é realmente admin
```sql
-- No Supabase SQL Editor
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as metadata_role
FROM auth.users
WHERE email = 'seu-email-admin@example.com';

SELECT 
  id,
  email,
  role
FROM public.profiles
WHERE email = 'seu-email-admin@example.com';
```

**Solução 3**: Fazer logout e login novamente
- Às vezes o token JWT precisa ser renovado

### Problema: Erro "permission denied for table orders"

**Causa**: RLS está bloqueando o acesso

**Solução**: Verificar se as políticas foram criadas corretamente
```sql
-- Deve retornar 1 linha
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename = 'orders' 
AND policyname = 'orders_select_own_or_admin';
```

## 📊 Comparação: Antes vs Depois

### Navegação

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Tipo de link | `<a href>` | `<Link>` |
| Comportamento | Reload completo | SPA navigation |
| Performance | Lento | Instantâneo |
| Experiência | Ruim | Excelente |

### Visualização de Pedidos

| Usuário | Antes | Depois |
|---------|-------|--------|
| Admin | Apenas seus pedidos | TODOS os pedidos |
| Usuário normal | Apenas seus pedidos | Apenas seus pedidos |

## ✅ Checklist Final

Após aplicar todas as correções, verifique:

### Navegação
- [ ] Links do admin usam `<Link>` do Next.js
- [ ] Navegação entre páginas é instantânea
- [ ] Não há reload completo da página
- [ ] URL muda corretamente

### Pedidos
- [ ] Admin vê TODOS os pedidos do sistema
- [ ] Admin vê pedidos de outros usuários
- [ ] Admin vê o pedido de teste mencionado
- [ ] Usuário normal vê apenas seus próprios pedidos
- [ ] Detalhes dos pedidos são visíveis

### Funcionalidades Admin
- [ ] Dashboard carrega corretamente
- [ ] Página de produtos funciona
- [ ] Página de pedidos funciona
- [ ] Filtros de pedidos funcionam
- [ ] Paginação funciona

## 📝 Notas Técnicas

### Por que usar Link ao invés de <a>?

O Next.js usa **Client-Side Navigation** com o componente `Link`:
- Pré-carrega páginas em background
- Navega sem reload completo
- Mantém estado da aplicação
- Muito mais rápido

### Por que a política RLS estava errada?

A política `orders_select_own` só permitia:
```sql
USING (auth.uid() = user_id)
```

Isso significa: "Só pode ver pedidos onde o user_id é igual ao seu ID"

Para admin, precisamos:
```sql
USING (
  auth.uid() = user_id  -- Seus próprios pedidos
  OR
  role = 'admin'        -- OU você é admin (vê tudo)
)
```

### Segurança

As políticas RLS garantem que:
- ✅ Usuários normais só veem seus próprios dados
- ✅ Admins veem todos os dados
- ✅ Não há vazamento de dados entre usuários
- ✅ Validação acontece no banco de dados (não apenas no frontend)

## 🎯 Resultado Final

Após aplicar todas as correções:

✅ Navegação do admin funciona perfeitamente  
✅ Admin vê TODOS os pedidos do sistema  
✅ Pedido de teste de outra conta aparece  
✅ Experiência de usuário melhorada  
✅ Performance otimizada  
✅ Segurança mantida  

---

**Última atualização**: 2026-04-11  
**Arquivos modificados**: 
- `apps/web/src/app/admin/layout.tsx`
- `supabase/migrations/20260411060000_add_admin_select_orders_policy.sql`
