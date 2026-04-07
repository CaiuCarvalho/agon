# Guia: Testar Core Flow Stabilization Localmente

## 🚨 Problema Identificado

Os testes manuais não salvaram porque você precisa estar **autenticado** para usar Cart, Wishlist e Address. As RLS (Row Level Security) policies bloqueiam operações de usuários não autenticados.

## ✅ Solução: Criar Usuário de Teste e Fazer Login

### Passo 1: Criar Usuário de Teste no Supabase

1. Acesse o SQL Editor do Supabase:
   ```
   https://supabase.com/dashboard/project/yyhpqecnxkvtnjdqhwhk/sql/new
   ```

2. Abra o arquivo `supabase-create-test-user.sql` no seu editor

3. Copie TODO o conteúdo do arquivo

4. Cole no SQL Editor do Supabase

5. Clique em **"Run"** ou pressione `Ctrl+Enter`

6. Aguarde a mensagem: **"✅ Usuário criado com sucesso!"**

### Passo 2: Verificar se o Usuário Foi Criado

No SQL Editor, execute:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'name' as nome
FROM auth.users
WHERE email = 'teste@agon.com';
```

Você deve ver:
- ✅ `email`: teste@agon.com
- ✅ `email_confirmed_at`: Data/hora (não NULL)
- ✅ `nome`: Usuário Teste

### Passo 3: Iniciar o Servidor Local

```bash
cd apps/web
npm run dev
```

Aguarde até ver:
```
✓ Ready in X.Xs
○ Local: http://localhost:3000
```

### Passo 4: Fazer Login

1. Abra o navegador: `http://localhost:3000/login`

2. Use as credenciais:
   - **Email**: `teste@agon.com`
   - **Senha**: `teste123`

3. Clique em **"Entrar na Conta"**

4. Você deve ser redirecionado para a home page

5. Verifique se aparece o nome do usuário no header (canto superior direito)

### Passo 5: Verificar Produtos Existem

Antes de testar Cart/Wishlist, verifique se há produtos no banco:

No SQL Editor do Supabase:

```sql
SELECT id, name, price, deleted_at 
FROM products 
WHERE deleted_at IS NULL
LIMIT 5;
```

**Se não houver produtos**, execute:

```sql
-- Criar produtos de teste
INSERT INTO products (name, description, price, stock, category, image_url)
VALUES 
  ('Camisa Brasil 2024', 'Camisa oficial da seleção brasileira', 299.90, 50, 'Vestuário', '/products/product-jersey.jpg'),
  ('Bola Oficial', 'Bola oficial de futebol', 149.90, 30, 'Equipamentos', '/products/product-ball.jpg'),
  ('Cachecol Brasil', 'Cachecol da seleção', 79.90, 100, 'Acessórios', '/products/product-scarf.jpg'),
  ('Shorts Brasil', 'Shorts oficial', 129.90, 40, 'Vestuário', '/products/product-shorts.jpg'),
  ('Boné Brasil', 'Boné oficial', 89.90, 60, 'Acessórios', '/products/product-cap.jpg')
ON CONFLICT (name) DO NOTHING;
```

### Passo 6: Executar Testes Manuais

Agora você pode executar os testes do `MANUAL_TESTING_CHECKLIST.md`:

#### 🛒 Teste 1: Adicionar Item ao Carrinho

1. Navegue para: `http://localhost:3000/products`
2. Clique em **"Adicionar ao Carrinho"** em qualquer produto
3. Observe o toast de sucesso: "Item adicionado ao carrinho"
4. Veja o badge do carrinho incrementar (ícone no header)
5. Navegue para: `http://localhost:3000/cart`
6. **Verifique**: Item aparece com preço e nome corretos

**Esperado**: ✅ Item salvo no banco de dados (tabela `cart_items`)

#### ❤️ Teste 2: Adicionar Item à Wishlist

1. Navegue para: `http://localhost:3000/products`
2. Clique no **ícone de coração** em qualquer produto
3. Observe o coração ficar preenchido
4. Observe o toast: "Item adicionado aos favoritos"
5. Navegue para: `http://localhost:3000/favoritos`
6. **Verifique**: Item aparece na lista de favoritos

**Esperado**: ✅ Item salvo no banco de dados (tabela `wishlist_items`)

#### 📍 Teste 3: Adicionar Endereço

1. Navegue para: `http://localhost:3000/perfil`
2. Clique em **"Adicionar Endereço"**
3. Preencha o formulário:
   - **CEP**: 01310-100
   - **Rua**: Avenida Paulista
   - **Número**: 1578
   - **Bairro**: Bela Vista
   - **Cidade**: São Paulo
   - **Estado**: SP
4. Marque **"Endereço padrão"**
5. Clique em **"Salvar"**
6. Observe o toast: "Endereço adicionado com sucesso"
7. **Verifique**: Endereço aparece na lista com badge "Padrão"

**Esperado**: ✅ Endereço salvo no banco de dados (tabela `addresses`)

## 🔍 Verificar se os Dados Foram Salvos

Após cada teste, verifique no SQL Editor do Supabase:

### Verificar Cart Items

```sql
SELECT 
  ci.id,
  ci.user_id,
  ci.product_id,
  ci.quantity,
  ci.price_snapshot,
  ci.product_name_snapshot,
  p.name as product_name_atual
FROM cart_items ci
LEFT JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = (SELECT id FROM auth.users WHERE email = 'teste@agon.com')
ORDER BY ci.created_at DESC;
```

**Esperado**:
- ✅ `price_snapshot` não é NULL
- ✅ `product_name_snapshot` não é NULL
- ✅ `quantity` = 1 (ou mais se adicionou múltiplas vezes)

### Verificar Wishlist Items

```sql
SELECT 
  wi.id,
  wi.user_id,
  wi.product_id,
  p.name as product_name
FROM wishlist_items wi
LEFT JOIN products p ON wi.product_id = p.id
WHERE wi.user_id = (SELECT id FROM auth.users WHERE email = 'teste@agon.com')
ORDER BY wi.created_at DESC;
```

**Esperado**:
- ✅ Linhas aparecem para cada item adicionado
- ✅ `product_id` corresponde ao produto clicado

### Verificar Addresses

```sql
SELECT 
  id,
  user_id,
  street,
  number,
  neighborhood,
  city,
  state,
  postal_code,
  is_default
FROM addresses
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste@agon.com')
ORDER BY created_at DESC;
```

**Esperado**:
- ✅ Endereço aparece com todos os campos preenchidos
- ✅ `is_default` = true para o endereço marcado como padrão

## 🚨 Solução de Problemas

### Problema: "Não consegui fazer login"

**Verificar 1**: Usuário existe e está confirmado?

```sql
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'teste@agon.com';
```

Se `email_confirmed_at` é NULL, execute:

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'teste@agon.com';
```

**Verificar 2**: Console do navegador (F12) mostra erros?

### Problema: "Item não foi salvo no carrinho"

**Verificar 1**: Você está autenticado?
- Veja se o nome do usuário aparece no header
- Veja se o console mostra `user: { id: '...', email: '...' }`

**Verificar 2**: Produto existe e não está deletado?

```sql
SELECT id, name, deleted_at 
FROM products 
WHERE deleted_at IS NULL;
```

**Verificar 3**: RLS policies estão corretas?

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'cart_items';
```

Deve ter policies para: SELECT, INSERT, UPDATE, DELETE

### Problema: "Erro ao adicionar endereço"

**Verificar 1**: Tabela `addresses` existe?

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'addresses';
```

**Verificar 2**: RLS está habilitado?

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'addresses';
```

Deve retornar `rowsecurity = true`

### Problema: "Console mostra erro 401 ou 403"

Isso significa que você não está autenticado ou as RLS policies estão bloqueando.

**Solução**:
1. Faça logout: `http://localhost:3000/logout`
2. Faça login novamente: `http://localhost:3000/login`
3. Tente novamente

## ✅ Checklist de Validação

Após executar os testes, marque o que funcionou:

- [ ] Usuário de teste criado no Supabase
- [ ] Login funcionou (redirecionou para home)
- [ ] Nome do usuário aparece no header
- [ ] Produtos aparecem na página `/products`
- [ ] Adicionar ao carrinho funcionou (toast + badge)
- [ ] Item aparece na página `/cart`
- [ ] Item foi salvo no banco (verificado no SQL Editor)
- [ ] Adicionar à wishlist funcionou (coração preenchido + toast)
- [ ] Item aparece na página `/favoritos`
- [ ] Item foi salvo no banco (verificado no SQL Editor)
- [ ] Adicionar endereço funcionou (toast de sucesso)
- [ ] Endereço aparece na lista com badge "Padrão"
- [ ] Endereço foi salvo no banco (verificado no SQL Editor)

## 🎯 Quando Subir para VPS?

Suba para VPS **SOMENTE DEPOIS** que todos os testes locais passarem:

- ✅ Todos os itens do checklist acima marcados
- ✅ Dados salvos corretamente no banco
- ✅ Nenhum erro no console do navegador
- ✅ Nenhum erro nos logs do servidor (`npm run dev`)

## 📝 Notas Importantes

1. **Sempre teste autenticado**: Cart, Wishlist e Address exigem autenticação
2. **Verifique o console**: Erros aparecem no console do navegador (F12)
3. **Verifique o banco**: Use SQL Editor para confirmar que dados foram salvos
4. **Produtos devem existir**: Sem produtos, não há o que adicionar ao carrinho
5. **RLS policies**: Se algo não salva, verifique as policies no Supabase

---

**Dúvidas?** Verifique os logs do navegador (F12 → Console) e do servidor (terminal onde rodou `npm run dev`).
