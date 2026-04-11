# Guia de Teste Manual do Webhook Mercado Pago

## Pré-requisitos

1. **Ambiente de desenvolvimento rodando**:
   ```bash
   npm run dev
   ```

2. **ngrok instalado** (para expor localhost):
   ```bash
   # Instalar ngrok (se não tiver)
   # Windows: choco install ngrok
   # Mac: brew install ngrok
   # Linux: snap install ngrok
   
   # Autenticar (obter token em https://dashboard.ngrok.com)
   ngrok authtoken YOUR_AUTH_TOKEN
   ```

3. **Conta Mercado Pago** com acesso ao dashboard

## Setup do Webhook

### 1. Iniciar ngrok

```bash
ngrok http 3000
```

Você verá algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

Copie a URL HTTPS (ex: `https://abc123.ngrok.io`)

### 2. Configurar Webhook no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em "Webhooks" no menu lateral
4. Clique em "Configurar notificações"
5. Configure:
   - **URL de produção**: `https://abc123.ngrok.io/api/webhooks/mercadopago`
   - **Eventos**: Selecione "Pagamentos"
6. Clique em "Salvar"
7. **IMPORTANTE**: Copie o "Webhook Secret" gerado

### 3. Configurar Variáveis de Ambiente

Adicione no arquivo `apps/web/.env.local`:

```env
MERCADOPAGO_WEBHOOK_SECRET=seu-webhook-secret-aqui
```

Reinicie o servidor de desenvolvimento após adicionar.

## Cenários de Teste

### Cenário 1: Primeiro Webhook (Seeding de Payment ID)

**Objetivo**: Validar que o `mercadopago_payment_id` é populado na primeira notificação.

**Passos**:
1. Crie um pedido no checkout da aplicação
2. Anote o `order_id` gerado
3. Vá para o Mercado Pago e aprove o pagamento (sandbox)
4. Observe os logs do servidor:

**Logs Esperados**:
```
[Webhook] Received: {
  type: 'payment',
  dataId: '12345678',
  requestId: 'req-abc-123',
  correlationId: 'req-abc-123',
  timestamp: '2024-01-01T00:00:00.000Z'
}
[Webhook] Signature validated { correlationId: 'req-abc-123' }
[Webhook] Payment details fetched: {
  paymentId: 12345678,
  status: 'approved',
  paymentMethod: 'pix',
  externalReference: 'order-uuid',
  correlationId: 'req-abc-123'
}
[Webhook] Payment found in database: {
  paymentId: 'payment-uuid',
  orderId: 'order-uuid',
  currentStatus: 'pending',
  storedMercadopagoPaymentId: null,
  correlationId: 'req-abc-123'
}
[Webhook] Seeding Mercado Pago payment ID (first webhook): {
  paymentId: 'payment-uuid',
  orderId: 'order-uuid',
  mercadopagoPaymentId: '12345678',
  correlationId: 'req-abc-123'
}
[Webhook] Successfully seeded Mercado Pago payment ID: {
  paymentId: 'payment-uuid',
  mercadopagoPaymentId: '12345678',
  correlationId: 'req-abc-123'
}
[Webhook] Status change detected, proceeding with update: {
  paymentId: 'payment-uuid',
  orderId: 'order-uuid',
  oldStatus: 'pending',
  newStatus: 'approved',
  correlationId: 'req-abc-123'
}
[Webhook] Calling RPC function to update payment and order: {
  mercadopagoPaymentId: '12345678',
  newStatus: 'approved',
  paymentMethod: 'pix',
  correlationId: 'req-abc-123'
}
[Webhook] Payment status updated successfully: {
  paymentId: 'payment-uuid',
  orderId: 'order-uuid',
  oldStatus: 'pending',
  newStatus: 'approved',
  orderStatus: 'processing',
  action: 'updated',
  correlationId: 'req-abc-123',
  timestamp: '2024-01-01T00:00:01.000Z'
}
```

**Validações**:
- ✅ Status do pedido mudou de `pending` para `processing`
- ✅ Campo `mercadopago_payment_id` foi populado na tabela `payments`
- ✅ Cart do usuário foi limpo
- ✅ Webhook retornou 200 OK

### Cenário 2: Webhook Duplicado (Idempotency)

**Objetivo**: Validar que webhooks duplicados não causam updates desnecessários.

**Passos**:
1. Use o mesmo pedido do Cenário 1
2. No Mercado Pago dashboard, vá em "Webhooks" > "Histórico"
3. Encontre o webhook enviado e clique em "Reenviar"
4. Observe os logs do servidor:

**Logs Esperados**:
```
[Webhook] Received: { ... }
[Webhook] Signature validated { ... }
[Webhook] Payment details fetched: { ... }
[Webhook] Payment found in database: {
  paymentId: 'payment-uuid',
  orderId: 'order-uuid',
  currentStatus: 'approved',
  storedMercadopagoPaymentId: '12345678',
  correlationId: 'req-xyz-456'
}
[Webhook] Idempotency check: Status unchanged, skipping update {
  paymentId: 'payment-uuid',
  orderId: 'order-uuid',
  status: 'approved',
  action: 'skipped',
  correlationId: 'req-xyz-456',
  timestamp: '2024-01-01T00:01:00.000Z'
}
```

**Validações**:
- ✅ Update foi skipped (não executado)
- ✅ Webhook retornou 200 OK com `skipped: true`
- ✅ Nenhuma mudança no banco de dados
- ✅ RPC function NÃO foi chamada

### Cenário 3: Assinatura Inválida

**Objetivo**: Validar que webhooks com assinatura inválida são rejeitados.

**Passos**:
1. Use curl para enviar webhook com assinatura inválida:

```bash
curl -X POST https://abc123.ngrok.io/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=invalid-hash" \
  -H "x-request-id: test-req-123" \
  -d '{
    "type": "payment",
    "data": {
      "id": "12345678"
    }
  }'
```

**Logs Esperados**:
```
[Webhook] Received: { ... }
[Webhook] Invalid signature { correlationId: 'test-req-123' }
```

**Validações**:
- ✅ Webhook retornou 401 Unauthorized
- ✅ Nenhum processamento foi feito
- ✅ Mercado Pago NÃO vai retentar (401 = erro permanente)

### Cenário 4: Payment Não Encontrado

**Objetivo**: Validar tratamento quando payment não existe no banco.

**Passos**:
1. Use curl para enviar webhook com order_id inexistente:

```bash
curl -X POST https://abc123.ngrok.io/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=VALID_HASH" \
  -H "x-request-id: test-req-456" \
  -d '{
    "type": "payment",
    "data": {
      "id": "99999999"
    }
  }'
```

**Logs Esperados**:
```
[Webhook] Received: { ... }
[Webhook] Signature validated { ... }
[Webhook] Payment details fetched: {
  externalReference: 'non-existent-order-id',
  ...
}
[Webhook] Payment not found in database: {
  externalReference: 'non-existent-order-id',
  error: { ... },
  correlationId: 'test-req-456'
}
```

**Validações**:
- ✅ Webhook retornou 404 Not Found
- ✅ Mercado Pago NÃO vai retentar (404 = erro permanente)

### Cenário 5: Conflito de Payment ID

**Objetivo**: Validar detecção de conflito quando payment_id já existe com valor diferente.

**Passos**:
1. Manualmente altere `mercadopago_payment_id` no banco para um valor diferente
2. Reenvie webhook do Mercado Pago
3. Observe os logs:

**Logs Esperados**:
```
[Webhook] Received: { ... }
[Webhook] Signature validated { ... }
[Webhook] Payment details fetched: { ... }
[Webhook] Payment found in database: {
  storedMercadopagoPaymentId: '11111111',
  ...
}
[Webhook] Payment ID mismatch - conflict detected: {
  orderId: 'order-uuid',
  storedPaymentId: '11111111',
  incomingPaymentId: '12345678',
  correlationId: 'req-abc-789'
}
```

**Validações**:
- ✅ Webhook retornou 409 Conflict
- ✅ Mercado Pago NÃO vai retentar (409 = erro permanente)
- ✅ Nenhuma mudança no banco de dados

### Cenário 6: Erro no RPC Function

**Objetivo**: Validar tratamento de erros internos (que devem retentar).

**Passos**:
1. Temporariamente quebre a RPC function (ex: remova do banco)
2. Envie webhook válido
3. Observe os logs:

**Logs Esperados**:
```
[Webhook] Received: { ... }
[Webhook] Signature validated { ... }
[Webhook] Payment details fetched: { ... }
[Webhook] Payment found in database: { ... }
[Webhook] Status change detected, proceeding with update: { ... }
[Webhook] Calling RPC function to update payment and order: { ... }
[Webhook] RPC function returned error: {
  error: { message: 'function update_payment_from_webhook does not exist' },
  correlationId: 'req-abc-999'
}
[Webhook] Failed to update payment status: {
  error: 'function update_payment_from_webhook does not exist',
  stack: '...',
  paymentId: 'payment-uuid',
  orderId: 'order-uuid',
  correlationId: 'req-abc-999'
}
```

**Validações**:
- ✅ Webhook retornou 500 Internal Server Error
- ✅ Mercado Pago VAI retentar (500 = erro temporário)
- ✅ Tentativas: até 12x em 48 horas

## Ferramentas de Debug

### 1. Logs do Servidor

Todos os logs incluem `correlationId` para rastreamento:

```bash
# Filtrar logs por correlation ID
grep "correlationId: 'req-abc-123'" logs.txt
```

### 2. Mercado Pago Dashboard

- **Webhooks > Histórico**: Ver todos os webhooks enviados
- **Webhooks > Logs**: Ver detalhes de cada tentativa
- **Pagamentos**: Ver status dos pagamentos

### 3. Banco de Dados

```sql
-- Ver payment com mercadopago_payment_id
SELECT * FROM payments WHERE mercadopago_payment_id = '12345678';

-- Ver order status
SELECT id, status, updated_at FROM orders WHERE id = 'order-uuid';

-- Ver cart items (deve estar vazio após aprovação)
SELECT * FROM cart_items WHERE user_id = 'user-uuid';
```

### 4. ngrok Inspector

Acesse: http://127.0.0.1:4040

- Ver todos os requests recebidos
- Inspecionar headers e body
- Reenviar requests para debug

## Troubleshooting

### Problema: Webhook não está sendo recebido

**Soluções**:
1. Verificar se ngrok está rodando
2. Verificar se URL no Mercado Pago está correta
3. Verificar se servidor de desenvolvimento está rodando
4. Verificar logs do ngrok: http://127.0.0.1:4040

### Problema: Assinatura sempre inválida

**Soluções**:
1. Verificar se `MERCADOPAGO_WEBHOOK_SECRET` está configurado
2. Verificar se secret está correto (copiar do dashboard)
3. Reiniciar servidor após adicionar variável
4. Verificar se headers estão sendo enviados corretamente

### Problema: Payment não encontrado

**Soluções**:
1. Verificar se pedido foi criado corretamente
2. Verificar se `external_reference` no Mercado Pago corresponde ao `order_id`
3. Verificar se payment record existe no banco
4. Verificar logs para ver `externalReference` recebido

### Problema: RPC function falha

**Soluções**:
1. Verificar se migration foi aplicada: `20250406_mercadopago_payments.sql`
2. Verificar se função existe no banco:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'update_payment_from_webhook';
   ```
3. Verificar logs de erro da RPC function
4. Testar RPC function manualmente no Supabase SQL Editor

## Checklist de Validação

- [ ] Webhook recebe notificação do Mercado Pago
- [ ] Assinatura é validada corretamente
- [ ] Payment details são buscados da API
- [ ] Payment é encontrado no banco por external_reference
- [ ] mercadopago_payment_id é populado na primeira notificação
- [ ] Conflito de payment_id é detectado e retorna 409
- [ ] Idempotency check funciona (webhooks duplicados são skipped)
- [ ] RPC function é chamada e atualiza payment e order
- [ ] Cart é limpo quando pagamento aprovado
- [ ] Códigos HTTP corretos são retornados (200, 400, 401, 404, 409, 500)
- [ ] Todos os logs incluem correlation_id
- [ ] Erros são logados com stack traces

## Próximos Passos

Após validar o webhook handler:

1. **Task 4**: Verificar/criar RPC function `update_payment_from_webhook`
2. **Task 5**: Implementar notificações em tempo real no admin panel
3. **Task 6**: Adicionar componentes de notificação (toast, browser, sound)
4. **Task 7**: Atualizar admin orders page com real-time subscriptions

