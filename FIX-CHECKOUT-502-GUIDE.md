# Guia de Correção: Erro 502 no Checkout

## Status Atual
✅ Código de tratamento de erros funcionando (mensagem melhorada aparecendo)  
❌ Erro 502 ainda ocorrendo em produção  
🔍 Causa raiz: Provavelmente configuração do Mercado Pago na VPS

## Passo 1: Executar Diagnóstico na VPS

```bash
# Copie o script para a VPS
scp DIAGNOSE-CHECKOUT-502.sh root@seu-servidor:/var/www/agon/app/

# Na VPS, execute:
cd /var/www/agon/app
bash DIAGNOSE-CHECKOUT-502.sh
```

## Passo 2: Analisar Resultados

### Cenário A: Token Ausente ou Vazio
**Sintoma:** `MERCADOPAGO_ACCESS_TOKEN` não está no .env.local ou está vazio

**Solução:**
```bash
# Na VPS
cd /var/www/agon/app/apps/web
nano .env.local

# Adicione a linha:
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui

# Salve (Ctrl+O, Enter, Ctrl+X)
# Reinicie:
pm2 restart agon-web
```

### Cenário B: Token com Formato Incorreto
**Sintoma:** Token não começa com `APP_USR-`

**Solução:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em "Credenciais de produção" ou "Credenciais de teste"
4. Copie o "Access Token" (deve começar com `APP_USR-`)
5. Atualize na VPS:
```bash
cd /var/www/agon/app/apps/web
nano .env.local
# Atualize MERCADOPAGO_ACCESS_TOKEN=APP_USR-novo-token
pm2 restart agon-web
```

### Cenário C: Token Inválido/Expirado
**Sintoma:** Teste de API retorna 401 ou 403

**Solução:**
1. Gere um novo token no painel do Mercado Pago
2. Atualize na VPS conforme Cenário B

### Cenário D: URL da Aplicação Incorreta
**Sintoma:** `NEXT_PUBLIC_APP_URL` está errado ou ausente

**Solução:**
```bash
cd /var/www/agon/app/apps/web
nano .env.local

# Verifique/adicione:
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Sem barra no final!
# Reinicie:
pm2 restart agon-web
```

### Cenário E: Timeout/Problemas de Rede
**Sintoma:** Logs mostram "ETIMEDOUT", "ECONNREFUSED", ou "timeout"

**Solução:**
1. Verifique firewall da VPS:
```bash
# Permitir saída HTTPS
ufw allow out 443/tcp
```

2. Teste conectividade:
```bash
curl -I https://api.mercadopago.com
```

3. Se necessário, aumente timeout ainda mais (já está em 30s)

## Passo 3: Verificar Logs Específicos

Após executar o diagnóstico, procure por:

```bash
# Logs de erro do Mercado Pago
pm2 logs agon-web --lines 200 | grep -A 10 "Mercado Pago error"

# Logs de criação de preferência
pm2 logs agon-web --lines 200 | grep -A 5 "Creating Mercado Pago preference"

# Erros de configuração
pm2 logs agon-web --lines 200 | grep -i "CRITICAL"
```

## Passo 4: Testar Checkout

Após aplicar a correção:

1. Limpe cache do navegador (Ctrl+Shift+Delete)
2. Ou use aba anônima (Ctrl+Shift+N)
3. Adicione produto ao carrinho
4. Vá para checkout
5. Preencha dados de entrega
6. Clique em "Finalizar Pedido"

## Causas Mais Prováveis (em ordem)

1. **Token não configurado na VPS** (80% de chance)
2. **Token com formato errado** (10% de chance)
3. **Token inválido/expirado** (5% de chance)
4. **URL da aplicação incorreta** (3% de chance)
5. **Problemas de rede/firewall** (2% de chance)

## Comandos Úteis

```bash
# Ver todas as variáveis de ambiente
cd /var/www/agon/app/apps/web
cat .env.local

# Ver logs em tempo real
pm2 logs agon-web

# Reiniciar aplicação
pm2 restart agon-web

# Ver status
pm2 status

# Limpar logs antigos
pm2 flush agon-web
```

## Próximos Passos

1. Execute o script de diagnóstico
2. Copie e cole TODA a saída aqui
3. Vou analisar e indicar a correção exata
