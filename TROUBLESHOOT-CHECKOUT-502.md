# Troubleshooting: Checkout API Retornando HTML ao invés de JSON

## Problema
Ao clicar em "Finalizar Pedido", aparece o erro:
```
Erro ao criar pedido: Unexpected token '<', "<html><h"... is not valid JSON
```

Isso significa que a API `/api/checkout/create-order` está retornando HTML (provavelmente uma página de erro) ao invés de JSON.

## Causas Possíveis

### 1. Aplicação não foi buildada corretamente
A rota da API pode não existir no build de produção.

### 2. Erro no servidor causando crash
A aplicação pode estar crashando ao processar a requisição.

### 3. Variáveis de ambiente faltando
Credenciais do Mercado Pago ou Supabase podem estar faltando.

## Passos para Diagnosticar

### Passo 1: Verificar logs do PM2

```bash
# Conectar ao VPS
ssh usuario@seu-servidor.com

# Ver logs em tempo real
pm2 logs agon-web --lines 100

# Ou ver logs salvos
pm2 logs agon-web --err --lines 50
```

**O que procurar:**
- Erros de "MERCADOPAGO_ACCESS_TOKEN is not configured"
- Erros de "NEXT_PUBLIC_APP_URL is not configured"
- Stack traces de erros
- Mensagens de "Creating Mercado Pago preference..."

### Passo 2: Verificar variáveis de ambiente

```bash
# No VPS, verificar se as variáveis estão configuradas
cd /var/www/agon/app
cat apps/web/.env.local
```

**Variáveis obrigatórias:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Passo 3: Verificar se a aplicação está rodando

```bash
# Verificar status do PM2
pm2 status

# Testar se a aplicação responde
curl http://localhost:3000

# Testar a rota da API diretamente
curl -X POST http://localhost:3000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -d '{"shippingInfo":{"shippingName":"Test"}}'
```

**Resposta esperada:**
- Se retornar JSON com erro de autenticação: ✅ API está funcionando
- Se retornar HTML: ❌ API não está funcionando

### Passo 4: Rebuild da aplicação

Se a API não estiver funcionando, faça rebuild:

```bash
cd /var/www/agon/app

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart agon-web

# Check logs
pm2 logs agon-web --lines 50
```

### Passo 5: Testar localmente primeiro

Antes de fazer deploy, teste localmente:

```bash
# No seu computador local
npm run build
npm run start

# Abrir http://localhost:3000
# Testar o checkout
```

Se funcionar localmente mas não no VPS, o problema é de configuração do servidor.

## Soluções Comuns

### Solução 1: Variáveis de ambiente faltando

```bash
# No VPS
cd /var/www/agon/app
nano apps/web/.env.local

# Adicionar/verificar:
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

Depois:
```bash
pm2 restart agon-web
```

### Solução 2: Rebuild completo

```bash
cd /var/www/agon/app
rm -rf apps/web/.next
rm -rf node_modules
npm install
npm run build
pm2 restart agon-web
```

### Solução 3: Verificar permissões

```bash
# Garantir que o usuário tem permissão nos arquivos
sudo chown -R $USER:$USER /var/www/agon/app
```

### Solução 4: Verificar memória do servidor

```bash
# Ver uso de memória
free -h

# Ver processos
htop
```

Se a memória estiver cheia, o Node.js pode estar crashando.

## Verificação Final

Depois de aplicar as correções:

1. Verificar logs: `pm2 logs agon-web`
2. Testar a API: `curl -X POST http://localhost:3000/api/checkout/create-order`
3. Testar no navegador: Fazer um pedido de teste

## Logs Úteis para Debug

### Ver logs de erro específicos do checkout:

```bash
pm2 logs agon-web | grep -i "checkout\|mercado\|preference"
```

### Ver últimos 200 logs:

```bash
pm2 logs agon-web --lines 200 --nostream
```

### Ver apenas erros:

```bash
pm2 logs agon-web --err --lines 100
```

## Contato

Se o problema persistir, envie:
1. Output de `pm2 logs agon-web --lines 100`
2. Output de `cat apps/web/.env.local` (sem mostrar os valores sensíveis)
3. Output de `curl -X POST http://localhost:3000/api/checkout/create-order`
