# Frontend State Synchronization - Correções Aplicadas

## Problema Identificado

Existiam DOIS sistemas de carrinho rodando em paralelo:
1. **Sistema Antigo**: `modules/checkout` usando Context API
2. **Sistema Novo**: `modules/cart` usando React Query + Supabase Realtime

Isso causava:
- Carrinho não atualizava na UI após adicionar itens
- Navegação inconsistente (botões abrindo flyout ao invés de navegar)
- Homepage usando dados mockados ao invés de dados reais do banco

## Correções Aplicadas

### 1. Padronização de Query Keys ✅

**Cart Query Keys**:
```typescript
['cart', user?.id]  // Padronizado em todos os hooks
```

**Wishlist Query Keys**:
```typescript
['wishlist', user?.id]  // Padronizado em todos os hooks
```

### 2. Navbar.tsx - Migrado para React Query

**Antes**:
```typescript
import { useCart } from "@/modules/checkout/hooks/useCart";
const { cart, openCart } = useCart();
const totalItems = cart?.items.reduce((acc, i) => acc + i.quantity, 0) || 0;
<button onClick={openCart}>...</button>
```

**Depois**:
```typescript
import { useCart } from "@/modules/cart/hooks/useCart";
const { items, totalItems } = useCart();
<Link href="/cart">...</Link>  // Navega para /cart ao invés de abrir flyout
```

### 3. Sidebar.tsx - Migrado para React Query

**Antes**:
```typescript
import { useCart } from "@/modules/checkout/hooks/useCart";
import { useWishlist } from "@/context/WishlistContext";
const { cart } = useCart();
const totalItems = cart?.items.reduce((acc, i) => acc + i.quantity, 0) || 0;
const { totalFavorites } = useWishlist();
```

**Depois**:
```typescript
import { useCart } from "@/modules/cart/hooks/useCart";
import { useWishlist } from "@/modules/wishlist/hooks/useWishlist";
const { items, totalItems } = useCart();
const { items: wishlistItems } = useWishlist();
const totalFavorites = wishlistItems.length;
```

### 4. Homepage - Dados Reais do Banco

**Antes**:
```typescript
const featuredProducts = [
  { id: "1", image: images.jersey, title: "Manto Titular 24/25 I", price: 349.90 },
  // ... produtos mockados
];
```

**Depois**:
```typescript
import { useProducts } from "@/modules/products/hooks";

const { data: productsData, isLoading: isLoadingProducts } = useProducts({ 
  limit: 4,
  sortBy: 'created_at',
  sortOrder: 'desc'
});

// Renderiza produtos reais do banco com loading state
```

### 5. Navegação Corrigida

**Botão Carrinho**:
- Antes: `<button onClick={openCart}>` (abria flyout)
- Depois: `<Link href="/cart">` (navega para página)

**Botão Wishlist**:
- Antes: Não existia navegação direta
- Depois: `<Link href="/favoritos">` (navega para página)

## Arquitetura Final

### Cart Flow (React Query)
```
User Action → useCartMutations.addToCart()
  ↓
Optimistic Update (setQueryData)
  ↓
API Call (cartService.addToCart)
  ↓
Cache Invalidation (invalidateQueries)
  ↓
Realtime Subscription (Supabase)
  ↓
UI Update (useCart hook)
```

### Wishlist Flow (React Query)
```
User Action → useWishlistMutations.toggleWishlist()
  ↓
Optimistic Update (setQueryData)
  ↓
API Call (wishlistService.addToWishlist)
  ↓
Cache Invalidation (invalidateQueries)
  ↓
Realtime Subscription (Supabase)
  ↓
UI Update (useWishlist hook)
```

## Componentes Atualizados

### ✅ Usando React Query Corretamente
- `apps/web/src/components/Navbar.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/app/page.tsx` (homepage)
- `apps/web/src/app/cart/page.tsx`
- `apps/web/src/app/favoritos/page.tsx`
- `apps/web/src/app/products/[id]/ClientActions.tsx`

### ⚠️ Sistema Antigo (Pode ser Removido)
- `apps/web/src/modules/checkout/hooks/useCart.ts`
- `apps/web/src/modules/checkout/context/CartContext.tsx`
- `apps/web/src/modules/checkout/components/CheckoutFlyout.tsx`

## Validação

### Checklist de Testes

- [ ] **Adicionar ao Carrinho**
  - Item aparece imediatamente na UI (optimistic update)
  - Toast de sucesso é exibido
  - Contador no navbar atualiza
  - Item persiste após refresh

- [ ] **Navegar para /cart**
  - Botão do carrinho navega para /cart
  - Página mostra todos os itens
  - Quantidades podem ser alteradas
  - Itens podem ser removidos

- [ ] **Adicionar à Wishlist**
  - Ícone de coração muda de estado imediatamente
  - Toast de sucesso é exibido
  - Contador no sidebar atualiza
  - Item persiste após refresh

- [ ] **Navegar para /favoritos**
  - Link navega para /favoritos
  - Página mostra todos os itens
  - Itens podem ser removidos
  - Limite de 20 itens é respeitado

- [ ] **Homepage**
  - Produtos reais do banco são exibidos
  - Loading state aparece durante fetch
  - Imagens e preços corretos
  - Links funcionam corretamente

## Logs de Debug

Os seguintes logs foram adicionados para debug:

### Cart Logs
```
[Migration] Starting migration for user: ...
[Migration] Migration result: ...
[Cart] Fetching cart items for user: ...
[Cart] Fetched items from database: X
[Cart] Item added successfully, invalidating cache
[Cart] Invalidating queries for user: ...
```

### Wishlist Logs
```
[Wishlist] Realtime subscription established
Wishlist realtime event: { eventType: 'INSERT', ... }
```

## Próximos Passos

1. **Testar fluxo completo**:
   - Login → Adicionar ao carrinho → Ver carrinho → Checkout
   - Adicionar à wishlist → Ver favoritos → Adicionar ao carrinho

2. **Remover sistema antigo** (opcional):
   - Deletar `modules/checkout/hooks/useCart.ts`
   - Deletar `modules/checkout/context/CartContext.tsx`
   - Remover `CheckoutFlyout` do layout se não for mais usado

3. **Validar Realtime**:
   - Abrir em duas abas
   - Adicionar item em uma aba
   - Verificar se aparece na outra aba

## Comandos de Teste

### Limpar Cache do Navegador
```javascript
// No DevTools Console
localStorage.clear()
location.reload()
```

### Verificar Query Keys
```javascript
// No DevTools Console (com React Query DevTools instalado)
// Verificar se as keys estão padronizadas como ['cart', userId] e ['wishlist', userId]
```

### Verificar Dados no Supabase
```sql
-- Verificar itens do carrinho
SELECT * FROM cart_items WHERE user_id = 'YOUR_USER_ID';

-- Verificar itens da wishlist
SELECT * FROM wishlist_items WHERE user_id = 'YOUR_USER_ID';

-- Verificar produtos
SELECT id, name, price, stock, image_url FROM products LIMIT 10;
```

## Notas Importantes

1. **Migration Gate**: O sistema de migração já foi corrigido para sempre completar, mesmo em caso de erro, para não bloquear a UI.

2. **Optimistic Updates**: Todos os mutations implementam optimistic updates com rollback automático em caso de erro.

3. **Realtime**: Supabase Realtime está configurado para sincronizar mudanças entre dispositivos/abas automaticamente.

4. **Query Invalidation**: Após cada mutation, as queries são invalidadas para garantir consistência com o servidor.

5. **Loading States**: Todos os componentes implementam loading states apropriados durante fetch de dados.
