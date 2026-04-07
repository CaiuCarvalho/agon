# ✅ Checklist de Setup do VPS - Agon

**Servidor:** 187.127.13.56 (Ubuntu 24.04.4)  
**Localização:** `/var/www/agon/app`

---

## 📋 Pré-Deploy (Fazer ANTES de subir código)

### 1. Verificar Supabase (Produção)

- [ ] Projeto criado no Supabase
- [ ] Todas as migrations aplicadas (14 migrations)
- [ ] Tabelas criadas: `cart_items`, `wishlist_items`, `orders`, `order_items`, `payments`, `products`, `profiles`
- [ ] RLS policies ativas em todas as tabelas
- [ ] Função RPC `create_order_with_payment_atomic` existe
- [ ] Produtos seedados (pelo menos 1 produto de teste)
- [ ] Credenciais copiadas:
  - [ ] Project URL: `https://xxxxx.supabase.co`
  - [ ] Anon Key: `eyJhbGci...`

**Verificação SQL:**
```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Verificar RPC
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_order_with_payment_atomic';

-- Verificar produtos
SELECT COUNT(*) FROM products;
```

---

### 2. Verificar Mercado Pago (Produção)

- [ ] Conta Mercado Pago ativada para produção
- [ ] Credenciais de PRODUÇÃO obtidas (não TEST)
- [ ] Access Token copiado: `APP_USR-xxxxx...`
- [ ] Webhook Secret gerado: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Webhook URL anotada: `https://seu-dominio.com/api/webhooks/mercadopago`

**⚠️ IMPORTANTE:** Use credenciais de PRODUÇÃO, não de teste!

---

### 3. Configurar Variáveis de Ambiente no VPS

```bash
# Conectar ao VPS
ssh usuario@187.127.13.56

# Navegar para o projeto
cd /var/www/agon/app

# Criar arquivo .env.local
nano apps/web/.env.local
```

**Conteúdo do .env.local (PRODUÇÃO):**
```env
# Supabase (PRODUÇÃO)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mercado Pago (PRODUÇÃO - NÃO USE TEST)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao-aqui
MERCADOPAGO_WEBHOOK_SECRET=seu-secret-gerado-com-crypto
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Resend (Email - opcional)
RESEND_API_KEY=re_seu_api_key

# Node Environment
NODE_ENV=production
```

**Checklist:**
- [ ] Arquivo criado em `apps/web/.env.local`
- [ ] Todas as variáveis preenchidas
- [ ] URLs corretas (HTTPS em produção)
- [ ] Tokens de PRODUÇÃO (não teste)
- [ ] Arquivo salvo (Ctrl+O, Enter, Ctrl+X)

---

### 4. Verificar Configuração do Nginx

```bash
# Ver configuração atual
cat /etc/nginx/sites-available/agon

# Testar configuração
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx
```

**Checklist:**
- [ ] Arquivo existe em `/etc/nginx/sites-available/agon`
- [ ] Link simbólico existe em `/etc/nginx/sites-enabled/agon`
- [ ] `proxy_pass http://localhost:3000` configurado
- [ ] SSL configurado (HTTPS)
- [ ] Domínio correto no `server_name`
- [ ] Nginx teste passou: `sudo nginx -t`

---

## 🚀 Deploy

### 5. Executar Deploy

```bash
# Tornar script executável (primeira vez)
chmod +x deploy-to-vps.sh

# Executar deploy
./deploy-to-vps.sh
```

**Checklist:**
- [ ] Script executou sem erros
- [ ] Build passou (✅ Build successful)
- [ ] PM2 reiniciou (✅ Application restarted)
- [ ] Status mostra "online": `pm2 status`

---

### 6. Verificar Logs

```bash
# Ver logs em tempo real
pm2 logs agon-web --lines 0

# Ver apenas erros
pm2 logs agon-web --err --lines 50
```

**Procurar por:**
- ❌ `MERCADOPAGO_ACCESS_TOKEN is not configured`
- ❌ `NEXT_PUBLIC_APP_URL is not configured`
- ❌ `Failed to create payment preference`
- ❌ `RPC error`
- ❌ `502 Bad Gateway`
- ✅ `Server listening on port 3000`
- ✅ `Ready in XXXms`

**Checklist:**
- [ ] Sem erros de variáveis de ambiente
- [ ] Sem erros de conexão com Supabase
- [ ] Sem erros de Mercado Pago
- [ ] Aplicação iniciou corretamente

---

## ✅ Pós-Deploy

### 7. Testar Site em Produção

**Testes Básicos:**
- [ ] Site carrega: `https://seu-dominio.com`
- [ ] Página inicial exibe produtos
- [ ] Imagens carregam (sem 404)
- [ ] Cadastro funciona
- [ ] Login funciona

**Testes de Carrinho:**
- [ ] Adicionar produto ao carrinho
- [ ] Ver carrinho
- [ ] Atualizar quantidade
- [ ] Remover produto

**Testes de Checkout (CRÍTICO):**
- [ ] Clicar em "Finalizar Compra"
- [ ] Preencher formulário de entrega
- [ ] Clicar em "Ir para Pagamento"
- [ ] **NÃO deve dar 502 Bad Gateway**
- [ ] Deve redirecionar para Mercado Pago
- [ ] Fazer pagamento de teste
- [ ] Verificar se pedido foi criado no banco

---

### 8. Configurar Webhook do Mercado Pago

```
1. Acessar: https://www.mercadopago.com.br/developers/panel/app
2. Selecionar aplicação
3. Ir em "Webhooks"
4. Clicar em "Configurar notificações"
5. URL de produção: https://seu-dominio.com/api/webhooks/mercadopago
6. Eventos: ✅ Pagamentos (payment)
7. Secret: [mesmo secret do .env.local]
8. Salvar
```

**Checklist:**
- [ ] Webhook configurado no painel
- [ ] URL correta (HTTPS)
- [ ] Secret igual ao .env.local
- [ ] Eventos "payment" selecionados

**Testar Webhook:**
```bash
# Fazer um pedido de teste no site
# Verificar logs
pm2 logs agon-web | grep webhook

# Deve aparecer:
# ✅ Webhook received: payment_id=123456789
# ✅ Payment status updated: approved
```

---

### 9. Corrigir URLs de Imagens (Se necessário)

Se imagens estão dando 404, executar no Supabase:

```sql
-- Verificar URLs atuais
SELECT id, name, image_url FROM products;

-- Corrigir URLs
UPDATE products 
SET image_url = '/images/products/' || SUBSTRING(image_url FROM '[^/]+$')
WHERE image_url LIKE '/products/%';

-- Verificar correção
SELECT id, name, image_url FROM products;
```

**Checklist:**
- [ ] SQL executado no Supabase (produção)
- [ ] URLs atualizadas
- [ ] Imagens carregando no site

---

### 10. Monitoramento Contínuo

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs agon-web

# Ver uso de recursos
pm2 monit

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Checklist:**
- [ ] PM2 status: "online"
- [ ] CPU < 50%
- [ ] Memory < 500MB
- [ ] Sem erros nos logs
- [ ] Sem 502 no Nginx

---

## 🐛 Troubleshooting

### Problema: 502 Bad Gateway

**Diagnóstico:**
```bash
# 1. Verificar se app está rodando
pm2 status

# 2. Ver logs de erro
pm2 logs agon-web --err --lines 100

# 3. Testar localmente
curl http://localhost:3000

# 4. Verificar variáveis de ambiente
cat apps/web/.env.local | grep -E "MERCADOPAGO|SUPABASE|APP_URL"
```

**Soluções:**
- [ ] Reiniciar app: `pm2 restart agon-web`
- [ ] Verificar .env.local tem todas as variáveis
- [ ] Verificar Supabase está acessível
- [ ] Verificar Mercado Pago token é válido
- [ ] Rebuild: `npm run build && pm2 restart agon-web`

---

### Problema: Imagens 404

**Solução:**
```sql
-- Executar no Supabase
UPDATE products 
SET image_url = '/images/products/' || SUBSTRING(image_url FROM '[^/]+$')
WHERE image_url LIKE '/products/%';
```

---

### Problema: Checkout não redireciona

**Diagnóstico:**
```bash
# Ver logs do checkout
pm2 logs agon-web | grep -A 20 "create-order"
```

**Verificar:**
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado
- [ ] `NEXT_PUBLIC_APP_URL` correto (HTTPS)
- [ ] RPC `create_order_with_payment_atomic` existe no banco
- [ ] Timeout do Mercado Pago não está sendo excedido

---

### Problema: Webhook não funciona

**Diagnóstico:**
```bash
# Ver logs de webhook
pm2 logs agon-web | grep webhook

# Testar manualmente
curl -X POST https://seu-dominio.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"data":{"id":"123"},"type":"payment"}'
```

**Verificar:**
- [ ] URL do webhook está correta no painel Mercado Pago
- [ ] Secret é o mesmo no painel e no .env.local
- [ ] Eventos "payment" estão selecionados
- [ ] Firewall não está bloqueando

---

## 📊 Métricas de Sucesso

Após deploy completo, você deve ter:

- ✅ Site acessível via HTTPS
- ✅ 0 erros 502
- ✅ 0 erros 404 em imagens
- ✅ Checkout funcionando 100%
- ✅ Webhook recebendo notificações
- ✅ Pedidos sendo criados no banco
- ✅ Carrinho sendo limpo após pagamento
- ✅ PM2 status: "online"
- ✅ Logs sem erros críticos

---

## 🎉 Deploy Completo!

Se todos os checkboxes acima estão marcados, seu e-commerce está no ar e funcionando! 🚀

**Próximos passos:**
1. Monitorar logs por 24h
2. Fazer pedidos de teste
3. Configurar backup automático
4. Implementar features do NEXT-FEATURES.md

---

**Última atualização:** 2026-04-06
