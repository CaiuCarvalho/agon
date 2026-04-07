# Guia de Testes: Mercado Pago Checkout

## 🧪 Testes Rápidos

### 1. Verificar Migration no Supabase

Execute no SQL Editor do Supabase:

```sql
-- Copie e cole o conteúdo de: supabase/verify-mercadopago-setup.sql
```

Você deve ver:
- ✅ payments table EXISTS
- ✅ Funções RPC existem
- ✅ Políticas RLS configuradas
- ✅ Índices criados

### 2. Testar Backend (API Routes)

#### Iniciar servidor

```bash
cd apps/web
npm run dev
```

Servidor deve iniciar em: http://localhost:3000

#### Verificar variáveis de ambiente

```bash
# No terminal, verifique se as variáveis estão carregadas
node -e "console.log(process.env.MERCADOPAGO_ACCESS_TOKEN ? '✅ Token configurado' : '❌ Token não encontrado')"
```

### 3. Testar Fluxo Completo

#### Passo 1: Fazer Login

1. Acesse: http://localhost:3000/login
2. Faça login com um usuário de teste

#### Passo 2: Adicionar Produtos ao Carrinho

1. Acesse: http://localhost:3000/products
2. Adicione pelo menos 1 produto ao carrinho
3. Vá para: http://localhost:3000/cart
4. Verifique se o produto está no carrinho

#### Passo 3: Ir para Checkout

1. Clique em "Finalizar Compra" ou acesse: http://localhost:3000/checkout
2. Você deve ver:
   - ✅ Formulário de entrega
   - ✅ Resumo do carrinho
   - ✅ Métodos de pagamento do Mercado Pago

#### Passo 4: Preencher Formulário

Dados de teste:

```
Nome: João Silva
CEP: 01310-100 (Av. Paulista, São Paulo)
Endereço: Avenida Paulista, 1000
Cidade: São Paulo (auto-preenchido)
Estado: SP (auto-preenchido)
Telefone: (11) 98765-4321
Email: joao@example.com
```

**Teste do CEP auto-fill:**
- Digite o CEP e saia do campo (blur)
- Endereço, cidade e estado devem ser preenchidos automaticamente

#### Passo 5: Finalizar Pedido

1. Clique em "Finalizar Pedido"
2. Você deve ver:
   - Toast: "Redirecionando para pagamento..."
   - Redirecionamento para página do Mercado Pago

#### Passo 6: Pagar no Mercado Pago (Sandbox)

Use cartão de teste:

```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 11/25
Nome: APRO (para aprovar) ou OTHE (para rejeitar)
CPF: 123.456.789-01
```

Mais cartões: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards

#### Passo 7: Verificar Resultado

Após o pagamento, você será redirecionado para:
- Aprovado: `/pedido/confirmado?order_id=...`
- Pendente: `/pedido/pendente?order_id=...`
- Rejeitado: `/pedido/falha?order_id=...`

**NOTA:** As páginas de resultado ainda não foram implementadas, então você verá um erro 404. Isso é esperado!

### 4. Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Ver últimos pedidos criados
SELECT 
  o.id,
  o.status,
  o.total_amount,
  o.shipping_name,
  o.created_at
FROM orders o
ORDER BY o.created_at DESC
LIMIT 5;

-- Ver últimos pagamentos criados
SELECT 
  p.id,
  p.order_id,
  p.mercadopago_preference_id,
  p.mercadopago_payment_id,
  p.status,
  p.amount,
  p.created_at
FROM payments p
ORDER BY p.created_at DESC
LIMIT 5;

-- Ver itens do pedido
SELECT 
  oi.order_id,
  oi.product_name,
  oi.quantity,
  oi.product_price,
  oi.subtotal
FROM order_items oi
WHERE oi.order_id = 'SEU_ORDER_ID_AQUI';
```

### 5. Testar Webhook (Opcional)

Para testar webhooks localmente, você precisa expor seu localhost:

#### Usar ngrok

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000
```

Você receberá uma URL como: `https://abc123.ngrok.io`

#### Configurar no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em Webhooks
3. Adicione: `https://abc123.ngrok.io/api/webhooks/mercadopago`
4. Selecione evento: Pagamentos

#### Testar webhook manualmente

```bash
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=abc123" \
  -H "x-request-id: test-123" \
  -d '{
    "data": {"id": "123456789"},
    "type": "payment",
    "action": "payment.updated"
  }'
```

Você deve ver nos logs do servidor:
```
Webhook received: { type: 'payment', dataId: '123456789', ... }
```

## 🐛 Problemas Comuns

### Erro: "MERCADOPAGO_ACCESS_TOKEN is not configured"

**Solução:**
1. Verifique se `.env.local` existe em `apps/web/`
2. Verifique se o token está correto
3. Reinicie o servidor (`npm run dev`)

### Erro: "Invalid MERCADOPAGO_ACCESS_TOKEN format"

**Solução:**
- O token deve começar com `APP_USR-`
- Verifique se copiou o Access Token (não o Public Key)

### CEP não preenche automaticamente

**Solução:**
1. Verifique se o CEP tem 8 dígitos
2. Teste com CEP válido: `01310-100`
3. Verifique console do navegador para erros

### Não redireciona para Mercado Pago

**Solução:**
1. Abra DevTools → Network
2. Verifique se a chamada para `/api/checkout/create-order` retorna `initPoint`
3. Verifique logs do servidor para erros

### Webhook não funciona

**Solução:**
1. Verifique se ngrok está rodando
2. Verifique URL configurada no painel do Mercado Pago
3. Verifique logs do servidor
4. Teste manualmente com curl

## ✅ Checklist de Testes

- [ ] Migration aplicada no Supabase
- [ ] Servidor rodando sem erros
- [ ] Login funcionando
- [ ] Adicionar produto ao carrinho
- [ ] Página de checkout carrega
- [ ] CEP auto-fill funciona
- [ ] Formulário valida corretamente
- [ ] Redireciona para Mercado Pago
- [ ] Pagamento no sandbox funciona
- [ ] Pedido criado no banco de dados
- [ ] Payment criado no banco de dados
- [ ] Webhook recebido (opcional)

## 📊 Logs Úteis

### Logs do Servidor (Terminal)

```
Order created successfully: { orderId: '...', preferenceId: '...', totalAmount: 100 }
Webhook received: { type: 'payment', dataId: '123', ... }
Payment status updated: { paymentId: '...', newStatus: 'approved', ... }
```

### Logs do Navegador (DevTools Console)

```
POST /api/checkout/create-order 200
Response: { success: true, initPoint: 'https://...' }
```

## 🎯 Próximos Passos

Depois de testar o fluxo básico:

1. ✅ Implementar páginas de resultado (sucesso, pendente, falha)
2. ✅ Testar diferentes métodos de pagamento (PIX, boleto)
3. ✅ Testar cenários de erro
4. ✅ Configurar webhook em produção
5. ✅ Trocar credenciais de teste por produção

## 📞 Suporte

- Documentação Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
- Cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards
