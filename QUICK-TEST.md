# 🚀 Teste Rápido - 5 Minutos

## Pré-requisitos
```bash
# Certifique-se de que o servidor está rodando
npm run dev
```

## Teste 1: Adicionar ao Carrinho (30 segundos)

1. Abra http://localhost:3000
2. Faça login: `teste@agon.com` / `teste123`
3. Vá para `/products`
4. Clique em qualquer produto
5. Clique em "Adicionar ao Carrinho"

**✅ Esperado**:
- Toast verde "Produto adicionado ao carrinho"
- Contador no navbar atualiza IMEDIATAMENTE (ex: 0 → 1)
- Sem delay perceptível

## Teste 2: Ver Carrinho (15 segundos)

1. Clique no ícone do carrinho no navbar
2. Deve navegar para `/cart` (NÃO abrir flyout)

**✅ Esperado**:
- Página `/cart` abre
- Item adicionado está presente
- Quantidade e preço corretos

## Teste 3: Atualizar Quantidade (20 segundos)

1. Na página `/cart`
2. Clique no botão `+` para aumentar quantidade
3. Clique no botão `-` para diminuir

**✅ Esperado**:
- Quantidade atualiza IMEDIATAMENTE
- Subtotal recalcula automaticamente
- Sem loading ou delay

## Teste 4: Adicionar à Wishlist (30 segundos)

1. Volte para `/products`
2. Clique em um produto
3. Clique no ícone de coração ❤️

**✅ Esperado**:
- Coração fica preenchido IMEDIATAMENTE
- Toast verde "Produto adicionado à wishlist"

## Teste 5: Ver Favoritos (15 segundos)

1. Abra o menu hamburguer (sidebar)
2. Clique em "Favoritos"
3. Deve navegar para `/favoritos`

**✅ Esperado**:
- Página `/favoritos` abre
- Item adicionado está presente

## Teste 6: Homepage com Dados Reais (20 segundos)

1. Volte para homepage `/`
2. Scroll até seção "Elite Collection"

**✅ Esperado**:
- Produtos REAIS do banco aparecem (não mocks)
- Nomes dos produtos do seed: Flamengo, Corinthians, Palmeiras, etc.
- Preços reais: R$ 279,90 - R$ 399,90

## Teste 7: Persistência (30 segundos)

1. Com itens no carrinho e wishlist
2. Pressione F5 (refresh)

**✅ Esperado**:
- Itens ainda estão presentes
- Contadores corretos
- Nada foi perdido

## 🐛 Se Algo Não Funcionar

### Carrinho não atualiza?
```javascript
// Abra DevTools Console (F12) e execute:
localStorage.setItem('agon_migrated', 'true');
location.reload();
```

### Produtos não aparecem na homepage?
```sql
-- Verifique se os produtos foram inseridos no Supabase:
-- Vá para Supabase Dashboard > SQL Editor > Execute:
SELECT id, name, price, stock FROM products LIMIT 10;
```

### Contador não atualiza?
```javascript
// Verifique os logs no console:
// Deve aparecer:
[Cart] Item added successfully, invalidating cache
[Cart] Invalidating queries for user: ...
[Cart] Fetching cart items for user: ...
```

## ✅ Checklist Rápido

- [ ] Adicionar ao carrinho funciona
- [ ] Contador atualiza imediatamente
- [ ] Botão carrinho navega para /cart
- [ ] Itens aparecem na página /cart
- [ ] Atualizar quantidade funciona
- [ ] Adicionar à wishlist funciona
- [ ] Botão favoritos navega para /favoritos
- [ ] Homepage mostra produtos reais
- [ ] Dados persistem após refresh

## 🎉 Sucesso!

Se todos os testes passaram, a sincronização está funcionando perfeitamente!

**Próximo passo**: Testar o fluxo completo de checkout.

## 📝 Notas

- **Tempo total**: ~5 minutos
- **Usuário de teste**: teste@agon.com / teste123
- **Produtos esperados**: Flamengo, Corinthians, Palmeiras, São Paulo, Brasil, Argentina, Real Madrid, Barcelona, PSG

## 🔍 Logs Esperados no Console

Ao adicionar item ao carrinho, você deve ver:
```
[Cart] Item added successfully, invalidating cache
[Cart] Invalidating queries for user: abc-123-def-456
[Cart] Fetching cart items for user: abc-123-def-456
[Cart] Fetched items from database: 1
```

Se não ver esses logs, algo está errado. Verifique `VALIDATION-CHECKLIST.md` para troubleshooting detalhado.
