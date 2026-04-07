# Checklist de Validação - Sincronização Frontend

## ✅ Correções Aplicadas

### 1. Padronização de Query Keys
- [x] Cart usa `['cart', user?.id]`
- [x] Wishlist usa `['wishlist', user?.id]`
- [x] Todos os hooks usam as mesmas keys
- [x] Mutations invalidam com as mesmas keys

### 2. Migração para React Query
- [x] Navbar migrado de Context para React Query
- [x] Sidebar migrado de Context para React Query
- [x] Removido CartProvider do layout
- [x] Removido WishlistProvider do layout
- [x] Removido CheckoutFlyout do layout

### 3. Navegação Corrigida
- [x] Botão carrinho navega para `/cart`
- [x] Botão wishlist navega para `/favoritos`
- [x] Removido flyout do carrinho

### 4. Homepage com Dados Reais
- [x] Importado `useProducts` hook
- [x] Removido array de produtos mockados
- [x] Implementado loading state
- [x] Produtos vêm do banco de dados

### 5. Optimistic Updates
- [x] Cart implementa optimistic updates
- [x] Wishlist implementa optimistic updates
- [x] Rollback automático em caso de erro

## 🧪 Testes Manuais

### Teste 1: Adicionar ao Carrinho
```
1. Ir para /products
2. Clicar em um produto
3. Clicar em "Adicionar ao Carrinho"
4. Verificar:
   ✓ Toast de sucesso aparece
   ✓ Contador no navbar atualiza imediatamente
   ✓ Item aparece na UI sem delay
5. Navegar para /cart
6. Verificar:
   ✓ Item está presente
   ✓ Quantidade correta
   ✓ Preço correto
7. Refresh da página
8. Verificar:
   ✓ Item ainda está presente
```

### Teste 2: Atualizar Quantidade no Carrinho
```
1. Estar em /cart com itens
2. Clicar em + para aumentar quantidade
3. Verificar:
   ✓ Quantidade atualiza imediatamente
   ✓ Subtotal atualiza
   ✓ Sem delay perceptível
4. Clicar em - para diminuir
5. Verificar:
   ✓ Quantidade diminui imediatamente
6. Refresh da página
7. Verificar:
   ✓ Quantidade persiste
```

### Teste 3: Remover do Carrinho
```
1. Estar em /cart com itens
2. Clicar no ícone de lixeira
3. Verificar:
   ✓ Item desaparece imediatamente
   ✓ Toast de sucesso
   ✓ Contador no navbar atualiza
4. Refresh da página
5. Verificar:
   ✓ Item não volta
```

### Teste 4: Adicionar à Wishlist
```
1. Ir para /products
2. Clicar em um produto
3. Clicar no ícone de coração
4. Verificar:
   ✓ Coração fica preenchido imediatamente
   ✓ Toast de sucesso
5. Ir para /favoritos
6. Verificar:
   ✓ Item está presente
7. Refresh da página
8. Verificar:
   ✓ Item ainda está presente
```

### Teste 5: Remover da Wishlist
```
1. Estar em /favoritos com itens
2. Hover no item
3. Clicar no ícone de lixeira
4. Verificar:
   ✓ Item desaparece imediatamente
   ✓ Toast de sucesso
5. Voltar para o produto
6. Verificar:
   ✓ Coração não está mais preenchido
```

### Teste 6: Homepage com Dados Reais
```
1. Ir para homepage (/)
2. Scroll até seção "Elite Collection"
3. Verificar:
   ✓ Loading spinner aparece (se lento)
   ✓ Produtos reais do banco aparecem
   ✓ Imagens carregam corretamente
   ✓ Preços estão corretos
   ✓ Links funcionam
4. Clicar em um produto
5. Verificar:
   ✓ Navega para página de detalhe correta
```

### Teste 7: Navegação do Navbar
```
1. Clicar no ícone do carrinho no navbar
2. Verificar:
   ✓ Navega para /cart (não abre flyout)
3. Abrir sidebar (menu hamburguer)
4. Clicar em "Meu Carrinho"
5. Verificar:
   ✓ Navega para /cart
6. Clicar em "Favoritos"
7. Verificar:
   ✓ Navega para /favoritos
```

### Teste 8: Realtime Sync (Opcional)
```
1. Abrir site em duas abas
2. Na aba 1: adicionar item ao carrinho
3. Na aba 2: verificar se item aparece automaticamente
4. Na aba 2: remover item
5. Na aba 1: verificar se item desaparece
```

### Teste 9: Migration Gate
```
1. Abrir DevTools Console
2. Executar: localStorage.removeItem('agon_migrated')
3. Refresh da página
4. Verificar logs:
   ✓ [Migration] Starting migration for user: ...
   ✓ [Migration] Migration result: ...
   ✓ [Migration] Success, marking as complete
5. Verificar:
   ✓ Carrinho carrega normalmente
   ✓ Não fica travado em loading
```

### Teste 10: Optimistic Updates com Erro
```
1. Desconectar internet
2. Tentar adicionar item ao carrinho
3. Verificar:
   ✓ Item aparece imediatamente (optimistic)
   ✓ Após timeout, item desaparece (rollback)
   ✓ Toast de erro aparece
4. Reconectar internet
5. Tentar novamente
6. Verificar:
   ✓ Item persiste desta vez
```

## 🔍 Verificação de Console

### Logs Esperados (Sucesso)

**Ao adicionar ao carrinho**:
```
[Cart] Item added successfully, invalidating cache
[Cart] Invalidating queries for user: abc-123
[Cart] Fetching cart items for user: abc-123
[Cart] Fetched items from database: 1
```

**Ao carregar página**:
```
[Migration] Already migrated, marking as complete
[Cart] Fetching cart items for user: abc-123
[Cart] Fetched items from database: X
```

**Realtime (se configurado)**:
```
[Wishlist] Realtime subscription established
Cart realtime event: { eventType: 'INSERT', ... }
```

### Erros Comuns

**Migration travada**:
```
[Migration] Starting migration for user: ...
// Sem "Migration result" ou "marking as complete"
```
**Solução**: `localStorage.setItem('agon_migrated', 'true'); location.reload()`

**Query key inconsistente**:
```
// Erro: mutation invalida ['cart'] mas query usa ['cart', userId]
```
**Solução**: Verificar se todas as keys estão padronizadas

**Optimistic update não reverte**:
```
// Item fica na UI mesmo após erro
```
**Solução**: Verificar se onError tem rollback com context.previousCart

## 📊 Métricas de Performance

### Tempos Esperados
- **Optimistic Update**: < 100ms (imediato)
- **Server Response**: < 500ms (rede normal)
- **Cache Invalidation**: < 100ms
- **Realtime Event**: < 1s

### Indicadores de Sucesso
- ✅ UI atualiza antes do servidor responder
- ✅ Sem flicker ou loading desnecessário
- ✅ Rollback automático em caso de erro
- ✅ Sincronização entre abas (se Realtime ativo)

## 🐛 Debug Commands

### Limpar Estado
```javascript
// Limpar tudo
localStorage.clear();
location.reload();

// Limpar apenas migration
localStorage.removeItem('agon_migrated');
location.reload();

// Limpar apenas cart/wishlist local
localStorage.removeItem('agon_cart');
localStorage.removeItem('agon_wishlist');
location.reload();
```

### Verificar Estado Atual
```javascript
// Ver migration status
console.log('Migrated:', localStorage.getItem('agon_migrated'));

// Ver cart local
console.log('Local cart:', localStorage.getItem('agon_cart'));

// Ver wishlist local
console.log('Local wishlist:', localStorage.getItem('agon_wishlist'));
```

### Forçar Refetch
```javascript
// No DevTools Console (com React Query DevTools)
// Clicar em "Refetch" na query desejada
```

## ✅ Critérios de Aceitação

### Funcionalidade
- [ ] Adicionar ao carrinho funciona
- [ ] Remover do carrinho funciona
- [ ] Atualizar quantidade funciona
- [ ] Adicionar à wishlist funciona
- [ ] Remover da wishlist funciona
- [ ] Navegação funciona corretamente
- [ ] Homepage mostra produtos reais

### Performance
- [ ] Updates são instantâneos (< 100ms)
- [ ] Sem loading desnecessário
- [ ] Rollback funciona em caso de erro

### Persistência
- [ ] Dados persistem após refresh
- [ ] Migration completa sem travar
- [ ] Realtime sync funciona (opcional)

### UX
- [ ] Toasts aparecem nos momentos certos
- [ ] Loading states são apropriados
- [ ] Erros são tratados graciosamente
- [ ] Contadores atualizam corretamente

## 📝 Notas Finais

1. **Sistema Antigo**: Os arquivos do sistema antigo (`modules/checkout/hooks/useCart.ts`, `CartContext`, etc.) ainda existem mas não são mais usados. Podem ser removidos em uma limpeza futura.

2. **Checkout Page**: A página de checkout (`/checkout`) ainda usa o sistema antigo. Isso é OK por enquanto, pois o checkout é um fluxo separado.

3. **React Query DevTools**: Recomendado instalar para debug:
   ```bash
   npm install @tanstack/react-query-devtools
   ```

4. **Supabase Realtime**: Certifique-se de que Realtime está habilitado nas tabelas `cart_items` e `wishlist_items` no dashboard do Supabase.

5. **RLS Policies**: Verifique se as políticas RLS estão configuradas corretamente para permitir que usuários acessem apenas seus próprios dados.
