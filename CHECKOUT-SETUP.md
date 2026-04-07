# Checkout MVP - Setup Guide

Este guia explica como configurar e testar o checkout MVP.

## Pré-requisitos

1. Tabela `products` deve existir no banco de dados
2. Se não existir, aplique primeiro: `supabase-product-catalog-schema.sql`

## Opção 1: Aplicar Migrações via Script (Recomendado)

```bash
# Certifique-se de que as variáveis de ambiente estão configuradas
# .env.local deve conter:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=... (necessário para o script)

# Execute o script
npx tsx scripts/apply-checkout-migrations.ts
```

## Opção 2: Aplicar Migrações Manualmente

1. Abra o Supabase SQL Editor
2. Copie todo o conteúdo de `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`
3. Cole no editor e execute

## Estrutura Criada

### Tabelas

- `orders` - Pedidos com informações de entrega
- `order_items` - Itens do pedido com snapshot de preços

### RLS Policies

- Usuários só podem ver/criar seus próprios pedidos
- Admins podem gerenciar todos os pedidos

### RPC Function

- `create_order_atomic` - Cria pedido atomicamente:
  - Valida carrinho não vazio
  - Valida estoque
  - Captura preços atuais
  - Cria pedido e itens
  - Limpa carrinho

## Testando o Checkout

1. Faça login na aplicação
2. Adicione produtos ao carrinho
3. Acesse `/checkout`
4. Preencha o formulário de entrega:
   - CEP: auto-completa endereço via ViaCEP
   - Telefone: formata automaticamente
   - Estado: seleção de estados brasileiros
5. Clique em "Finalizar Pedido"
6. Você será redirecionado para `/pedido/confirmado?orderId=...`

## Validações Implementadas

### Cliente (Zod)
- CEP: formato XXXXX-XXX
- Telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
- Estado: códigos brasileiros válidos
- Email: formato válido

### Servidor (PostgreSQL)
- Carrinho não vazio
- Estoque suficiente
- Preços válidos (>= 0)
- Quantidade válida (1-99)

## Forma de Pagamento

MVP usa apenas "Pagamento na Entrega" (cash_on_delivery).

## Frete

MVP usa frete grátis (R$ 0,00).

## Arquivos Principais

### Services
- `apps/web/src/modules/checkout/services/orderService.ts`
- `apps/web/src/modules/checkout/services/validationService.ts`

### Hooks
- `apps/web/src/modules/checkout/hooks/useCheckout.ts`
- `apps/web/src/modules/checkout/hooks/useOrder.ts`

### Components
- `apps/web/src/modules/checkout/components/ShippingForm.tsx`
- `apps/web/src/modules/checkout/components/CartSummary.tsx`
- `apps/web/src/modules/checkout/components/PaymentMethodSelector.tsx`
- `apps/web/src/modules/checkout/components/CheckoutPageClient.tsx`
- `apps/web/src/modules/checkout/components/OrderConfirmationClient.tsx`

### Pages
- `apps/web/src/app/checkout/page.tsx`
- `apps/web/src/app/pedido/confirmado/page.tsx`

### Contracts
- `apps/web/src/modules/checkout/contracts.ts` (Zod schemas)

## Próximos Passos

Após testar o MVP, você pode adicionar:
- Integração com gateway de pagamento
- Cálculo de frete
- Cupons de desconto
- Rastreamento de pedidos
- Notificações por email
