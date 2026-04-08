# Deploy da Correção do Erro 502 no Checkout

Este guia explica como aplicar as correções do erro 502 no checkout na sua VPS.

## 🎯 O que foi corrigido

- ✅ Validação de variáveis de ambiente com logs detalhados
- ✅ Timeout do Mercado Pago SDK ajustado (30s → 25s)
- ✅ Tratamento de erro de timeout melhorado (retorna 504 ao invés de 502)
- ✅ Timeout de 60s adicionado ao fetch do cliente
- ✅ Template completo no .env.production com instruções

## 📋 Pré-requisitos

Antes de fazer o deploy, você precisa ter:

1. Acesso SSH à sua VPS
2. URL do seu domínio (ex: https://agonimports.com)
3. Access Token do Mercado Pago de PRODUÇÃO
4. Webhook Secret do Mercado Pago (opcional)

## 🔧 Passo 1: Obter Credenciais do Mercado Pago

### 1.1 Access Token de Produção

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Clique em **"Credenciais de produção"**
3. Copie o **"Access Token"** (formato: `APP_USR-XXXX...`)

⚠️ **IMPORTANTE**: Use credenciais de PRODUÇÃO, não de teste/sandbox!

### 1.2 Webhook Secret (Opcional)

1. Acesse: https://www.mercadopago.com.br/developers/panel/webhooks
2. Configure um webhook apontando para: `https://seu-dominio.com/api/webhooks/mercadopago`
3. Copie o secret gerado

## 🚀 Passo 2: Deploy na VPS

### 2.1 Conectar na VPS

```bash
ssh seu-usuario@seu-servidor-vps
```

### 2.2 Navegar para o diretório do projeto

```bash
cd /caminho/para/seu/projeto/agon
```

### 2.3 Fazer backup do .env.local atual

```bash
cp apps/web/.env.local apps/web/.env.local.backup
```

### 2.4 Atualizar o código

```bash
# Fazer pull das alterações
git pull origin main

# Ou se você fez commit local
git add .
git commit -m "fix: corrigir erro 502 no checkout"
git push origin main
```

### 2.5 Configurar variáveis de ambiente

Edite o arquivo `.env.local` na VPS:

```bash
nano apps/web/.env.local
```

**Adicione/atualize estas variáveis OBRIGATÓRIAS:**

```env
# URL base da aplicação (OBRIGATÓRIO)
NEXT_PUBLIC_APP_URL=https://agonimports.com

# Access Token do Mercado Pago (OBRIGATÓRIO)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao-aqui

# Webhook Secret (OPCIONAL - para webhooks futuros)
MERCADOPAGO_WEBHOOK_SECRET=seu-webhook-secret-aqui
```

**Substitua:**
- `https://agonimports.com` → Seu domínio real
- `APP_USR-seu-token-de-producao-aqui` → Seu Access Token de produção
- `seu-webhook-secret-aqui` → Seu Webhook Secret (se configurou)

Salve e feche (Ctrl+X, depois Y, depois Enter)

### 2.6 Instalar dependências

```bash
npm install
```

### 2.7 Build do projeto

```bash
npm run build
```

### 2.8 Reiniciar o servidor

**Se estiver usando PM2:**

```bash
pm2 restart all
# ou
pm2 restart agon-web
```

**Se estiver usando systemd:**

```bash
sudo systemctl restart agon
```

**Se estiver rodando manualmente:**

```bash
# Parar o processo atual (Ctrl+C)
# Depois iniciar novamente
npm run start
```

## ✅ Passo 3: Verificar se está funcionando

### 3.1 Verificar logs

**Com PM2:**

```bash
pm2 logs agon-web --lines 50
```

**Com systemd:**

```bash
sudo journalctl -u agon -n 50 -f
```

### 3.2 Verificar variáveis de ambiente

Procure nos logs por estas mensagens ao iniciar:

```
[CHECKOUT] ✓ MERCADOPAGO_ACCESS_TOKEN configured
[CHECKOUT] ✓ NEXT_PUBLIC_APP_URL configured: https://agonimports.com
```

### 3.3 Testar o checkout

1. Acesse seu site: https://agonimports.com
2. Adicione produtos ao carrinho
3. Vá para o checkout
4. Preencha os dados de entrega
5. Clique em "Finalizar Pedido"

**Resultado esperado:**
- ✅ Você deve ser redirecionado para o Mercado Pago
- ✅ Não deve aparecer erro 502

## 🐛 Troubleshooting

### Erro: "Configuração de URL ausente"

**Causa:** `NEXT_PUBLIC_APP_URL` não está configurada

**Solução:**
```bash
# Editar .env.local
nano apps/web/.env.local

# Adicionar:
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Rebuild e restart
npm run build
pm2 restart all
```

### Erro: "Configuração de pagamento ausente"

**Causa:** `MERCADOPAGO_ACCESS_TOKEN` não está configurada

**Solução:**
```bash
# Editar .env.local
nano apps/web/.env.local

# Adicionar:
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui

# Rebuild e restart
npm run build
pm2 restart all
```

### Erro 504: "Timeout ao conectar com o serviço de pagamento"

**Causa:** Mercado Pago está demorando muito para responder

**Solução:**
- Isso é esperado em caso de problemas de rede
- O usuário verá mensagem clara pedindo para tentar novamente
- O pedido é automaticamente revertido (rollback)
- Peça ao usuário para tentar novamente

### Ainda aparece erro 502

**Verificar:**

1. **Variáveis estão corretas?**
   ```bash
   # Ver variáveis (sem mostrar valores sensíveis)
   grep -E "NEXT_PUBLIC_APP_URL|MERCADOPAGO" apps/web/.env.local
   ```

2. **Build foi feito?**
   ```bash
   # Verificar se pasta .next existe
   ls -la apps/web/.next
   ```

3. **Servidor foi reiniciado?**
   ```bash
   pm2 status
   # ou
   sudo systemctl status agon
   ```

4. **Logs mostram erro?**
   ```bash
   pm2 logs --lines 100
   ```

## 📊 Monitoramento

### Ver logs em tempo real

```bash
# Com PM2
pm2 logs agon-web --lines 100

# Com systemd
sudo journalctl -u agon -f
```

### Procurar por erros específicos

```bash
# Procurar por erros de timeout
pm2 logs | grep -i timeout

# Procurar por erros 502
pm2 logs | grep "502"

# Procurar por erros de configuração
pm2 logs | grep "CRITICAL"
```

## 🎉 Sucesso!

Se tudo funcionou, você deve ver:

1. ✅ Checkout redireciona para Mercado Pago
2. ✅ Não aparece erro 502
3. ✅ Logs mostram timestamps e informações detalhadas
4. ✅ Erros de timeout retornam 504 com mensagem clara

## 📞 Suporte

Se ainda tiver problemas:

1. Copie os logs: `pm2 logs --lines 200 > logs.txt`
2. Verifique se as variáveis estão configuradas
3. Confirme que o build foi feito após as alterações
4. Verifique se o servidor foi reiniciado

## 🔐 Segurança

⚠️ **NUNCA compartilhe:**
- Seu `MERCADOPAGO_ACCESS_TOKEN`
- Seu `MERCADOPAGO_WEBHOOK_SECRET`
- Seu arquivo `.env.local`

✅ **Sempre:**
- Use credenciais de PRODUÇÃO em produção
- Use credenciais de TESTE em desenvolvimento
- Mantenha backups do `.env.local`
