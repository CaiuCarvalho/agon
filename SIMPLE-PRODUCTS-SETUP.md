# Setup Simples de Produtos - MVP

## ✅ O que foi feito:

1. **Simplificada página `/products`**
   - Lista todos os produtos do banco
   - Sem filtros complexos
   - Grid responsivo simples
   - Botão "Adicionar Rápido" no hover
   - Botão de favoritar

2. **Criada página `/products/[id]`**
   - Detalhes do produto
   - Seletor de quantidade
   - Botão "Adicionar ao Carrinho"
   - Botão "Comprar Agora" (adiciona e vai para carrinho)
   - Botão de favoritar

## 🚀 Como Testar:

### 1. Executar Seed de Produtos

```bash
# Abrir SQL Editor do Supabase
https://supabase.com/dashboard/project/yyhpqecnxkvtnjdqhwhk/sql/new

# Colar conteúdo de: supabase/seed-products.sql
# Clicar em "Run"
```

### 2. Criar Usuário de Teste

```bash
# No SQL Editor, executar: supabase-create-test-user.sql
# Credenciais: teste@agon.com / teste123
```

### 3. Iniciar Servidor

```bash
cd apps/web
npm run dev
```

### 4. Testar Fluxo Completo

1. **Login**: http://localhost:3000/login
   - Email: `teste@agon.com`
   - Senha: `teste123`

2. **Produtos**: http://localhost:3000/products
   - Ver 9 produtos (Flamengo, Corinthians, etc)
   - Hover no card → botão "Adicionar Rápido" aparece
   - Clicar "Adicionar Rápido" → adiciona 1 unidade ao carrinho
   - Clicar no coração → adiciona à wishlist

3. **Detalhes**: Clicar em qualquer produto
   - Ver descrição completa
   - Selecionar quantidade (+ / -)
   - Clicar "Adicionar ao Carrinho"
   - OU clicar "Comprar Agora" (vai direto para carrinho)

4. **Carrinho**: http://localhost:3000/cart
   - Ver produtos adicionados
   - Alterar quantidade
   - Remover produtos
   - Seguir para checkout

## 📁 Arquivos Modificados/Criados:

```
apps/web/src/app/
├── products/
│   ├── page.tsx                    # ✅ Simplificado
│   └── [id]/
│       ├── page.tsx                # ✅ Novo
│       └── ClientActions.tsx       # ✅ Novo
```

## ✅ Funcionalidades:

- [x] Listar produtos do banco
- [x] Adicionar ao carrinho (lista e detalhes)
- [x] Adicionar à wishlist (lista e detalhes)
- [x] Seletor de quantidade (detalhes)
- [x] Comprar agora (detalhes)
- [x] Ver detalhes do produto
- [x] Badges de estoque baixo
- [x] Estados de loading
- [x] Responsivo

## 🎯 Próximo Passo:

Agora você pode seguir com a implementação do **checkout**!

Os produtos estão funcionais e podem ser adicionados ao carrinho/wishlist.

---

**Status**: ✅ MVP Funcional
**Pronto para**: Checkout
