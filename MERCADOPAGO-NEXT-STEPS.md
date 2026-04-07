# Mercado Pago Checkout - Próximos Passos

## ✅ O que já foi feito

1. ✅ Variáveis de ambiente configuradas (`.env.local`)
2. ✅ Pacote `mercadopago` instalado
3. ✅ Migration SQL criada (`supabase/migrations/20250406_mercadopago_payments.sql`)
4. ✅ Tipos TypeScript criados (`types.ts`)
5. ✅ Schemas de validação Zod criados (`contracts.ts`)
6. ✅ Serviço Mercado Pago criado (`mercadoPagoService.ts`)
7. ✅ Serviço de Pagamentos criado (`paymentService.ts`)
8. ✅ Serviço ViaCEP criado (`viaCEPService.ts`)
9. ✅ Serviço de Validação criado (`validationService.ts`)

## 🚀 Próximos Passos (em ordem)

### 1. Aplicar Migration no Supabase ⚠️ IMPORTANTE

Você precisa aplicar a migration no banco de dados:

```bash
# Opção 1: Via Dashboard do Supabase (mais fácil)
# 1. Acesse https://app.supabase.com
# 2. Vá em SQL Editor
# 3. Copie o conteúdo de: supabase/migrations/20250406_mercadopago_payments.sql
# 4. Cole e execute

# Opção 2: Via CLI (se tiver instalado)
supabase db push
```

### 2. Criar API Route para Criação de Pedido

Arquivo: `apps/web/src/app/api/checkout/create-order/route.ts`

Este endpoint vai:
- Validar autenticação
- Criar pedido + pagamento atomicamente
- Criar preferência no Mercado Pago
- Retornar URL de redirecionamento

### 3. Criar Webhook Endpoint

Arquivo: `apps/web/src/app/api/webhooks/mercadopago/route.ts`

Este endpoint vai:
- Receber notificações do Mercado Pago
- Validar assinatura HMAC
- Atualizar status de pagamento
- Limpar carrinho quando aprovado

### 4. Criar Componentes de UI

- `ShippingForm.tsx` - Formulário com validação brasileira e CEP auto-fill
- `PaymentMethodsDisplay.tsx` - Exibir métodos de pagamento disponíveis
- `CheckoutPageClient.tsx` - Página de checkout client-side

### 5. Criar Páginas de Resultado

- `/pedido/confirmado` - Pagamento aprovado
- `/pedido/pendente` - Pagamento pendente (PIX, boleto)
- `/pedido/falha` - Pagamento rejeitado

### 6. Configurar Webhook no Mercado Pago

Siga o guia: `MERCADOPAGO-SETUP-GUIDE.md`

## 📝 Comandos Úteis

```bash
# Instalar dependências (se necessário)
cd apps/web
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Expor localhost para testar webhooks
npx ngrok http 3000

# Verificar se migration foi aplicada
# Execute no SQL Editor do Supabase:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'payments';
```

## 🧪 Como Testar

1. Aplicar migration no Supabase
2. Rodar `npm run dev`
3. Adicionar produtos ao carrinho
4. Ir para `/checkout`
5. Preencher formulário
6. Ser redirecionado para Mercado Pago
7. Usar cartão de teste: `5031 4332 1540 6351`
8. Verificar webhook recebido
9. Verificar carrinho limpo

## 📚 Documentação

- Setup completo: `MERCADOPAGO-SETUP-GUIDE.md`
- Spec de requisitos: `.kiro/specs/mercado-pago-checkout/requirements.md`
- Spec de design: `.kiro/specs/mercado-pago-checkout/design.md`
- Plano de tarefas: `.kiro/specs/mercado-pago-checkout/tasks.md`

## ❓ Dúvidas?

Consulte o guia de setup ou a documentação oficial do Mercado Pago:
https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing
