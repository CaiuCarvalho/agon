# Guia de Diagnóstico - Erro 502 no Checkout (VPS)

## 🎯 Objetivo

Este guia vai te ajudar a diagnosticar e corrigir o erro 502 no checkout da VPS, focando especificamente nas variáveis de ambiente.

## 📋 Pré-requisitos

- Acesso SSH à VPS
- Aplicação rodando com PM2
- Node.js instalado

## 🔍 Passo 1: Executar Diagnóstico Automático

### 1.1 Fazer upload do script de diagnóstico

```bash
# Na sua máquina local, copie o arquivo para a VPS
scp diagnose-vps-env.js user@your-vps-ip:/path/to/your/app/
```

### 1.2 Executar o script na VPS

```bash
# Conectar na VPS
ssh user@your-vps-ip

# Navegar até o diretório da aplicação
cd /path/to/your/app/apps/web

# Executar o diagnóstico
node ../../diagnose-vps-env.js
```

### 1.3 Analisar o resultado

O script vai mostrar:
- ✓ = Variável configurada corretamente
- ✗ = Variável ausente ou inválida
- [CRITICAL] = Variável obrigatória para o checkout funcionar
- [OPTIONAL] = Variável opcional

## 🔧 Passo 2: Corrigir Variáveis Ausentes

### 2.1 Verificar arquivo .env.local

```bash
# Verificar se o arquivo existe
ls -la apps/web/.env.local

# Se não existir, criar a partir do template
cp apps/web/.env.production apps/web/.env.local
```

### 2.2 Editar o arquivo .env.local

```bash
# Editar com nano ou vim
nano apps/web/.env.local
```

### 2.3 Configurar as variáveis CRÍTICAS

Certifique-se de que estas variáveis estão configuradas:

```bash
# URL base da aplicação (OBRIGATÓRIO)
NEXT_PUBLIC_APP_URL=https://agonimports.com

# Token do Mercado Pago (OBRIGATÓRIO)
# Formato: APP_USR-XXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui

# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ambiente (OBRIGATÓRIO)
NODE_ENV=production
```

### 2.4 Salvar e sair

- No nano: `Ctrl + X`, depois `Y`, depois `Enter`
- No vim: `Esc`, depois `:wq`, depois `Enter`

## 🔄 Passo 3: Rebuild e Restart

### 3.1 Rebuild da aplicação

```bash
# Navegar até a raiz do projeto
cd /path/to/your/app

# Instalar dependências (se necessário)
npm install

# Rebuild do Next.js
cd apps/web
npm run build
```

### 3.2 Restart do PM2

```bash
# Restart de todos os processos
pm2 restart all

# OU restart específico
pm2 restart web

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs
```

## ✅ Passo 4: Verificar Correção

### 4.1 Executar diagnóstico novamente

```bash
node ../../diagnose-vps-env.js
```

Deve mostrar: `✓ ALL CHECKS PASSED`

### 4.2 Testar o checkout

1. Acesse o site: https://agonimports.com
2. Adicione produtos ao carrinho
3. Vá para o checkout
4. Preencha os dados de entrega
5. Clique em "Finalizar Pedido"

**Resultado esperado:**
- ✓ Redirecionamento para o Mercado Pago
- ✗ Erro 502 (se ainda ocorrer, vá para o Passo 5)

## 🐛 Passo 5: Diagnóstico Avançado (se ainda houver erro)

### 5.1 Verificar logs do PM2

```bash
# Ver logs em tempo real
pm2 logs --lines 100

# Procurar por erros específicos
pm2 logs | grep -i "error\|critical\|checkout"
```

### 5.2 Verificar logs do Nginx

```bash
# Ver logs de erro do Nginx
sudo tail -f /var/log/nginx/error.log

# Procurar por 502
sudo grep "502" /var/log/nginx/error.log | tail -20
```

### 5.3 Testar a rota diretamente

```bash
# Testar a rota de checkout diretamente (sem Nginx)
curl -X POST http://localhost:3000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=seu-token-aqui" \
  -d '{
    "shippingInfo": {
      "shippingName": "Test User",
      "shippingAddress": "Rua Test, 123",
      "shippingCity": "São Paulo",
      "shippingState": "SP",
      "shippingZip": "01234-567",
      "shippingPhone": "(11) 98765-4321",
      "shippingEmail": "test@example.com"
    }
  }'
```

**Resultado esperado:**
- Se retornar JSON: A aplicação está funcionando, problema pode ser no Nginx
- Se retornar 502: Problema na aplicação, verificar logs do PM2

### 5.4 Verificar conectividade com Mercado Pago

```bash
# Testar conexão com API do Mercado Pago
curl -X GET https://api.mercadopago.com/v1/payment_methods \
  -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN"
```

**Resultado esperado:**
- Se retornar JSON com métodos de pagamento: Conexão OK
- Se retornar erro 401: Token inválido
- Se retornar timeout: Problema de rede/firewall

## 📊 Passo 6: Checklist de Verificação

Marque cada item conforme for verificando:

- [ ] Arquivo `.env.local` existe em `apps/web/`
- [ ] Variável `NEXT_PUBLIC_APP_URL` está configurada
- [ ] Variável `MERCADOPAGO_ACCESS_TOKEN` está configurada
- [ ] Token do Mercado Pago começa com `APP_USR-`
- [ ] Variáveis do Supabase estão configuradas
- [ ] Build do Next.js foi executado após configurar variáveis
- [ ] PM2 foi reiniciado após configurar variáveis
- [ ] Diagnóstico automático passa sem erros críticos
- [ ] Logs do PM2 não mostram erros de variáveis ausentes
- [ ] Teste manual do checkout funciona

## 🆘 Problemas Comuns

### Problema 1: "NEXT_PUBLIC_APP_URL not configured"

**Causa:** Variável não está no arquivo .env.local ou PM2 não foi reiniciado

**Solução:**
```bash
# Adicionar ao .env.local
echo "NEXT_PUBLIC_APP_URL=https://agonimports.com" >> apps/web/.env.local

# Restart PM2
pm2 restart all
```

### Problema 2: "Invalid MERCADOPAGO_ACCESS_TOKEN format"

**Causa:** Token não começa com `APP_USR-`

**Solução:**
1. Acesse https://www.mercadopago.com.br/developers/panel/credentials
2. Copie o "Access Token" de produção (deve começar com APP_USR-)
3. Cole no .env.local
4. Restart PM2

### Problema 3: Erro 502 persiste após configurar variáveis

**Causa:** Build antigo do Next.js ainda em cache

**Solução:**
```bash
# Limpar cache e rebuild
cd apps/web
rm -rf .next
npm run build
pm2 restart all
```

### Problema 4: "Timeout ao conectar com o serviço de pagamento"

**Causa:** Firewall bloqueando conexão com Mercado Pago ou rede instável

**Solução:**
```bash
# Verificar conectividade
curl -I https://api.mercadopago.com

# Se falhar, verificar firewall
sudo ufw status

# Permitir saída HTTPS (se necessário)
sudo ufw allow out 443/tcp
```

## 📞 Próximos Passos

Se após seguir todos os passos o erro persistir:

1. **Copie os logs completos:**
   ```bash
   pm2 logs --lines 200 > pm2-logs.txt
   sudo tail -100 /var/log/nginx/error.log > nginx-logs.txt
   ```

2. **Execute o diagnóstico e salve o resultado:**
   ```bash
   node ../../diagnose-vps-env.js > diagnostic-result.txt
   ```

3. **Compartilhe os arquivos:**
   - pm2-logs.txt
   - nginx-logs.txt
   - diagnostic-result.txt

## 🎉 Sucesso!

Se o checkout funcionar:
- ✓ Variáveis de ambiente configuradas corretamente
- ✓ Aplicação rodando sem erros
- ✓ Integração com Mercado Pago funcionando
- ✓ Usuários podem finalizar pedidos

**Próximos passos recomendados:**
1. Configurar webhook do Mercado Pago (variável `MERCADOPAGO_WEBHOOK_SECRET`)
2. Configurar monitoramento de erros (Sentry, LogRocket, etc.)
3. Configurar backup automático do banco de dados
4. Configurar SSL/HTTPS se ainda não estiver configurado
