# Guia de Setup: Mercado Pago Checkout

Este guia explica como configurar a integração do Mercado Pago no seu projeto.

## 📋 Pré-requisitos

- Conta no Mercado Pago (https://www.mercadopago.com.br)
- Acesso ao painel de desenvolvedores
- Supabase configurado e rodando

## 🔑 Passo 1: Obter Credenciais do Mercado Pago

### Credenciais de Teste (Desenvolvimento)

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie uma aplicação ou selecione uma existente
3. Vá em "Credenciais de teste"
4. Copie o **Access Token** (começa com `APP_USR-`)

**Suas credenciais de teste:**
- Public Key: `APP_USR-2ae5c9f0-c121-4926-8707-4bee493dd8ef`
- Access Token: `APP_USR-1231127407252531-032721-a1baf345e686ae2c99a32895ac6346c7-568670523`
- User ID: `3319595850`

### Credenciais de Produção (Quando for ao ar)

1. No mesmo painel, vá em "Credenciais de produção"
2. Complete o processo de ativação da conta
3. Copie o **Access Token de produção**

## 🗄️ Passo 2: Aplicar Migrations no Supabase

### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse seu projeto no Supabase: https://app.supabase.com
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo: `supabase/migrations/20250406_mercadopago_payments.sql`
5. Cole no editor e clique em **Run**
6. Verifique se não há erros

### Opção B: Via CLI do Supabase

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

### Verificar se a migration foi aplicada

Execute esta query no SQL Editor:

```sql
-- Verificar se a tabela payments foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'payments';

-- Verificar se as funções RPC foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_order_with_payment_atomic', 'update_payment_from_webhook');
```

Você deve ver:
- Tabela `payments`
- Função `create_order_with_payment_atomic`
- Função `update_payment_from_webhook`

## 🔐 Passo 3: Configurar Variáveis de Ambiente

O arquivo `apps/web/.env.local` já está configurado com as credenciais de teste.

**IMPORTANTE:** Nunca commite o arquivo `.env.local` no Git!

### Para Produção

Quando for para produção, atualize:

```env
# Mercado Pago (PRODUCTION credentials)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao
MERCADOPAGO_WEBHOOK_SECRET=seu-secret-seguro-aqui
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 🪝 Passo 4: Configurar Webhook no Mercado Pago

Os webhooks são necessários para receber notificações de pagamento em tempo real.

### Durante Desenvolvimento (Localhost)

Para testar webhooks localmente, você precisa expor seu localhost:

#### Opção 1: Usar ngrok (Recomendado)

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000
```

Você receberá uma URL como: `https://abc123.ngrok.io`

#### Opção 2: Usar localtunnel

```bash
# Instalar localtunnel
npm install -g localtunnel

# Expor porta 3000
lt --port 3000
```

### Configurar Webhook no Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **Webhooks**
4. Clique em **Configurar notificações**
5. Em "URL de produção" ou "URL de teste", adicione:
   - Desenvolvimento: `https://sua-url-ngrok.ngrok.io/api/webhooks/mercadopago`
   - Produção: `https://seu-dominio.com/api/webhooks/mercadopago`
6. Selecione os eventos:
   - ✅ **Pagamentos** (payment)
7. Clique em **Salvar**

### Gerar Webhook Secret

O Mercado Pago não fornece um secret automaticamente. Você deve criar um:

```bash
# Gerar um secret aleatório seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e adicione em:
- `.env.local` → `MERCADOPAGO_WEBHOOK_SECRET`
- Painel do Mercado Pago → Configurações de Webhook → Secret

## 🧪 Passo 5: Testar a Integração

### 1. Iniciar o servidor de desenvolvimento

```bash
cd apps/web
npm run dev
```

### 2. Testar criação de pedido

1. Adicione produtos ao carrinho
2. Vá para `/checkout`
3. Preencha o formulário de entrega
4. Clique em "Finalizar Compra"
5. Você será redirecionado para o Mercado Pago

### 3. Testar pagamento (Sandbox)

Use os cartões de teste do Mercado Pago:

**Cartão aprovado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Validade: qualquer data futura
- Nome: qualquer nome

**Cartão rejeitado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Validade: qualquer data futura
- Nome: `APRO` (aprovado) ou `OTHE` (rejeitado)

Mais cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards

### 4. Verificar webhook

Após completar o pagamento, verifique:

1. **Logs do servidor** - deve aparecer:
   ```
   Webhook received: payment_id=123456789
   Payment status updated: approved
   ```

2. **Banco de dados** - execute no Supabase:
   ```sql
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
   ```

3. **Carrinho limpo** - o carrinho deve estar vazio após pagamento aprovado

## 🐛 Troubleshooting

### Erro: "MERCADOPAGO_ACCESS_TOKEN is not configured"

- Verifique se o `.env.local` existe em `apps/web/`
- Reinicie o servidor de desenvolvimento

### Erro: "Invalid MERCADOPAGO_ACCESS_TOKEN format"

- O token deve começar com `APP_USR-`
- Verifique se copiou o token completo

### Webhook não está sendo recebido

1. Verifique se o ngrok está rodando
2. Verifique a URL configurada no painel do Mercado Pago
3. Teste manualmente:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/mercadopago \
     -H "Content-Type: application/json" \
     -H "x-signature: ts=1234567890,v1=abc123" \
     -H "x-request-id: test-123" \
     -d '{"data":{"id":"123"},"type":"payment"}'
   ```

### Erro: "Payment not found" no webhook

- Isso é normal na primeira chamada do webhook
- O sistema precisa buscar o pagamento no Mercado Pago primeiro
- Verifique os logs para mais detalhes

### Erro de RLS (Row Level Security)

- Verifique se as políticas RLS foram criadas corretamente
- Execute a migration novamente se necessário

## 📚 Próximos Passos

Após configurar tudo:

1. ✅ Teste o fluxo completo de checkout
2. ✅ Teste diferentes métodos de pagamento (cartão, PIX, boleto)
3. ✅ Teste cenários de erro (cartão recusado, timeout)
4. ✅ Implemente as páginas de resultado (sucesso, pendente, falha)
5. ✅ Configure monitoramento de webhooks em produção

## 🔒 Segurança em Produção

Antes de ir para produção:

- [ ] Trocar credenciais de teste por produção
- [ ] Usar HTTPS (obrigatório para webhooks)
- [ ] Configurar webhook secret forte
- [ ] Habilitar logs de webhook
- [ ] Configurar alertas para falhas de webhook
- [ ] Testar com valores reais pequenos primeiro

## 📞 Suporte

- Documentação Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
- Suporte Mercado Pago: https://www.mercadopago.com.br/developers/pt/support
- Issues do projeto: [link do seu repositório]
