# 🔧 CONFIGURAR APLICAÇÃO MERCADO PAGO - Agon Imports

## 📋 INFORMAÇÕES PARA PREENCHER

### Configurações Básicas

#### Logotipo
- **Formato**: JPG ou PNG
- **Tamanho máximo**: 1MB
- **Recomendação**: Use o logo do Agon Imports (se tiver)
- **Opcional**: Pode deixar sem logo inicialmente

#### Nome da aplicação
```
Agon Imports - Checkout
```
ou
```
Agon Imports E-commerce
```

#### Nome curto (opcional)
```
Agon
```

#### Descrição da aplicação
```
Sistema de checkout e pagamentos online para a loja Agon Imports. Integração com Checkout Pro do Mercado Pago para processar pagamentos de produtos de vestuário, calçados e acessórios.
```

#### Setor
```
✅ Vestuário, calçados e acessórios
```
(Já está selecionado corretamente!)

#### URL do site em produção
```
https://agonimports.com
```

---

### Tipo de Solução de Pagamento

#### Qual tipo de solução você vai integrar?
```
✅ Pagamentos online
❌ Pagamentos presenciais
```

#### Você está usando uma plataforma de e-commerce?
```
❌ Não
```
(Porque é uma aplicação customizada em Next.js)

#### Qual produto você está integrando?
```
✅ Checkout Pro
```

#### Modelo de integração (Opcional)
```
Deixe em branco ou selecione: Redirect
```

---

### Configurações Avançadas

#### URLs de redirecionamento
```
❌ Deixe em branco
```
(Não é necessário para Checkout Pro, apenas para OAuth)

#### Usar o fluxo de código de autorização com o PKCE?
```
❌ Não
```

#### Permissões da aplicação
```
✅ Deixe as permissões padrão
```

---

## 📝 RESUMO DA CONFIGURAÇÃO

```
┌─────────────────────────────────────────────────────────┐
│  CONFIGURAÇÃO MERCADO PAGO - AGON IMPORTS               │
├─────────────────────────────────────────────────────────┤
│  Nome: Agon Imports - Checkout                          │
│  Descrição: Sistema de checkout e pagamentos online     │
│  Setor: Vestuário, calçados e acessórios               │
│  URL: https://agonimports.com                           │
│  Tipo: Pagamentos online                                │
│  Produto: Checkout Pro                                  │
│  Plataforma: Não (customizada)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 APÓS SALVAR A CONFIGURAÇÃO

### 1. Obter Credenciais de Produção

Após salvar, vá em:
```
Credenciais → Credenciais de produção
```

Você verá:
- **Public Key**: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Access Token**: `APP_USR-xxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Verificar se as Credenciais Estão Corretas

As credenciais que você já tem configuradas são:
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-6434179465639582-040620-91dcf67827adfca6a253eca0cb9c8c2e-568670523
```

✅ **Confirme se este Access Token aparece no painel de credenciais de produção.**

Se for diferente, você precisará atualizar o `.env.local` na VPS.

---

## 🪝 CONFIGURAR WEBHOOK (OPCIONAL - RECOMENDADO)

### Por que configurar webhook?

O webhook permite que o Mercado Pago notifique sua aplicação em tempo real sobre mudanças no status do pagamento.

### Como configurar:

1. No painel do Mercado Pago, vá em:
   ```
   Webhooks → Configurar notificações
   ```

2. Adicione a URL:
   ```
   https://agonimports.com/api/webhooks/mercadopago
   ```

3. Selecione os eventos:
   ```
   ✅ Pagamentos (payment)
   ```

4. Salve a configuração

### Webhook Secret

O webhook secret que você já tem configurado é:
```
MERCADOPAGO_WEBHOOK_SECRET=d79153bf3c2655799d8766b671e90488da7cdeaf8750bbc0afd4004e9ef71c87
```

✅ **Este secret já está configurado no código e no `.env.local`.**

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### No Painel do Mercado Pago
- [ ] Nome da aplicação preenchido
- [ ] Descrição preenchida
- [ ] Setor selecionado (Vestuário, calçados e acessórios)
- [ ] URL do site preenchida (https://agonimports.com)
- [ ] Tipo de solução: Pagamentos online
- [ ] Produto: Checkout Pro
- [ ] Configuração salva
- [ ] Credenciais de produção obtidas
- [ ] Webhook configurado (opcional)

### Na VPS
- [x] MERCADOPAGO_ACCESS_TOKEN configurado
- [x] MERCADOPAGO_WEBHOOK_SECRET configurado
- [x] NEXT_PUBLIC_APP_URL configurado
- [x] Aplicação rodando

---

## 🧪 TESTAR A INTEGRAÇÃO

### 1. Teste Básico (Sem Pagamento Real)

```bash
# Na VPS, teste a rota de checkout
curl -X POST http://localhost:30000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=SEU_TOKEN_AQUI" \
  -d '{
    "items": [
      {
        "id": "produto-teste",
        "title": "Produto Teste",
        "quantity": 1,
        "unit_price": 100
      }
    ],
    "customer": {
      "name": "Teste",
      "email": "teste@teste.com"
    }
  }'
```

### 2. Teste Completo (No Navegador)

1. Acesse: https://agonimports.com
2. Faça login
3. Adicione produtos ao carrinho
4. Vá para o checkout
5. Preencha os dados
6. Clique em "Finalizar Compra"
7. Você será redirecionado para o Mercado Pago
8. Complete o pagamento

**URLs de retorno esperadas:**
- Sucesso: `https://agonimports.com/checkout/success?payment_id=xxx`
- Pendente: `https://agonimports.com/checkout/pending?payment_id=xxx`
- Falha: `https://agonimports.com/checkout/failure?payment_id=xxx`

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### Ver Logs em Tempo Real

```bash
# Na VPS
pm2 logs agon-web
```

### Verificar Pagamentos no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/activities
2. Veja os pagamentos recebidos
3. Verifique o status de cada pagamento

### Verificar Pedidos no Supabase

```sql
-- No Supabase SQL Editor
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;
```

---

## ⚠️ IMPORTANTE: DIFERENÇA ENTRE TESTE E PRODUÇÃO

### Credenciais de Teste (Desenvolvimento)
```
Access Token: APP_USR-854979957979936-040618-...
Ambiente: Sandbox
Pagamentos: Não são reais
```

### Credenciais de Produção (VPS)
```
Access Token: APP_USR-6434179465639582-040620-...
Ambiente: Produção
Pagamentos: São reais e cobrados
```

✅ **Você já está usando as credenciais de PRODUÇÃO na VPS.**

---

## 🆘 TROUBLESHOOTING

### Erro: "MERCADOPAGO_ACCESS_TOKEN is not configured"

Verifique o `.env.local`:
```bash
cat /var/www/agon/app/apps/web/.env.local | grep MERCADOPAGO
```

### Erro: "Invalid credentials"

1. Verifique se o Access Token está correto no painel do Mercado Pago
2. Confirme que está usando credenciais de PRODUÇÃO, não de teste
3. Verifique se o token não tem espaços extras

### Webhook não está sendo chamado

1. Verifique se a URL está correta: `https://agonimports.com/api/webhooks/mercadopago`
2. Teste manualmente:
   ```bash
   curl -X POST https://agonimports.com/api/webhooks/mercadopago \
     -H "Content-Type: application/json" \
     -d '{"data":{"id":"123"},"type":"payment"}'
   ```
3. Veja os logs:
   ```bash
   pm2 logs agon-web | grep webhook
   ```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **Mercado Pago Docs**: https://www.mercadopago.com.br/developers/pt/docs
- **Checkout Pro**: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing
- **Webhooks**: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Preencher configurações no painel do Mercado Pago
2. ✅ Salvar configuração
3. ✅ Verificar credenciais de produção
4. ⏳ Configurar webhook (opcional)
5. ⏳ Testar checkout completo no navegador
6. ⏳ Verificar se pagamentos estão sendo processados

---

**Preencha as configurações conforme este guia e me avise quando terminar!**
