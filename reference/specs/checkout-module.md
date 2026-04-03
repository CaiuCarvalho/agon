# Especificação de Feature: Módulo de Checkout (B2C)

## 1. PROBLEMA
O usuário torcedor precisa de uma forma fluida de visualizar, adicionar e remover itens do seu carrinho de compras sem sair da página atual, garantindo que o estado seja persistente e reflita a realidade do estoque (simulado).

## 2. OBJETIVOS
- Implementar um Sidebar (Flyout) para visualização rápida.
- Garantir atualizações otimistas (Optimistic UI) para sensação de velocidade instantânea.
- Suportar múltiplos tamanhos e quantidades.
- Simular latência de rede e falhas para testar a resiliência da interface.

## 3. CONTRATOS DE DADOS (Zod)
- **CartItem**: `{ productId, name, price, quantity, size, imageUrl }`
- **Cart**: `{ sessionId, items: CartItem[], total: number }`
- **AddToCartPayload**: `{ productId, quantity, size }`

## 4. CRITÉRIOS DE ACEITE
- [ ] O carrinho deve abrir automaticamente ao adicionar um item.
- [ ] As atualizações de quantidade/remoção devem aparecer na UI em menos de 100ms (otimista).
- [ ] Se o "backend" (mock) falhar, o estado deve ser revertido (rollback) e um erro exibido.
- [ ] O total do carrinho deve ser recalculado no Frontend e validado pelo Backend.
- [ ] Skeletons devem aparecer durante o carregamento inicial da sessão.

## 5. REQUISITOS TÉCNICOS
- **Módulo**: `apps/web/src/modules/checkout`
- **State**: `CartProvider` (Context API)
- **Service**: `checkoutService` (Puro, batendo no `MockBackend`)
- **Animações**: `framer-motion` (Slide lateral com bounce spring)
