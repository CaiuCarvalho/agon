# Debug Final: Checkout 502

## Situação Atual

✅ Mercado Pago token configurado (APP_USR-..., 74 chars)  
✅ API do Mercado Pago respondendo (HTTP 200)  
✅ Imagens de produtos corrigidas (fallbacks criados)  
❌ Checkout ainda retornando 502

## Próximos Passos de Debug

### 1. Ver Logs Específicos do Checkout

Execute na VPS:

```bash
pm2 logs agon-web --lines 200 | grep -A 15 -B 5 "Creating Mercado Pago preference\|Mercado Pago error\|CRITICAL\|create-order"
```

Isso vai mostrar exatamente onde o erro está acontecendo.

### 2. Testar Configuração do Mercado Pago

Execute na VPS:

```bash
cd /var/www/agon/app
node test-mercadopago-config.js
```

Este script vai:
- Verificar todas as variáveis de ambiente
- Validar formato do token
- Fazer uma requisição REAL para criar uma preferência de teste
- Mostrar exatamente qual é o erro (se houver)

### 3. Possíveis Causas

Com base no diagnóstico anterior, as causas mais prováveis são:

#### A. Token de Teste vs Produção
- **Sintoma:** API retorna 401 ou 403
- **Causa:** Usando token de teste em produção (ou vice-versa)
- **Solução:** Verificar em https://www.mercadopago.com.br/developers/panel/app
  - Use "Credenciais de produção" para produção
  - Use "Credenciais de teste" para desenvolvimento

#### B. Aplicação Não Ativada
- **Sintoma:** API retorna erro de permissão
- **Causa:** Aplicação do Mercado Pago não está ativada
- **Solução:** Ativar aplicação no painel do Mercado Pago

#### C. Timeout/Rede
- **Sintoma:** Erro ETIMEDOUT ou ECONNREFUSED
- **Causa:** Firewall bloqueando ou timeout muito curto
- **Solução:** 
  ```bash
  # Verificar conectividade
  curl -I https://api.mercadopago.com
  
  # Permitir saída HTTPS
  ufw allow out 443/tcp
  ```

#### D. Erro no Código da API
- **Sintoma:** Erro antes de chamar Mercado Pago
- **Causa:** Erro no Supabase, validação, ou lógica da API
- **Solução:** Ver logs completos

### 4. Comandos Úteis

```bash
# Ver logs em tempo real
pm2 logs agon-web

# Ver apenas erros
pm2 logs agon-web --err

# Ver logs completos (últimas 500 linhas)
pm2 logs agon-web --lines 500 --nostream

# Reiniciar e monitorar
pm2 restart agon-web && pm2 logs agon-web

# Verificar variáveis de ambiente
cd /var/www/agon/app/apps/web
cat .env.local | grep MERCADO
```

### 5. Se o Teste Passar Mas Checkout Falhar

Se `test-mercadopago-config.js` passar mas o checkout ainda falhar, o problema está em:
- Autenticação do usuário (Supabase)
- Criação do pedido (RPC `create_order_with_payment_atomic`)
- Busca de itens do carrinho
- Validação dos dados de entrega

Nesse caso, precisamos ver os logs completos do checkout.

## Execute Agora

1. **Primeiro:** Execute o teste de configuração
   ```bash
   cd /var/www/agon/app
   node test-mercadopago-config.js
   ```

2. **Depois:** Me envie a saída completa do teste

3. **Se o teste passar:** Tente o checkout novamente e me envie os logs:
   ```bash
   pm2 logs agon-web --lines 200 | grep -A 15 -B 5 "checkout\|mercado"
   ```

## Checklist de Verificação

- [ ] Executou `bash CREATE-PRODUCT-IMAGE-FALLBACKS.sh`
- [ ] Reiniciou PM2 (`pm2 restart agon-web`)
- [ ] Limpou cache do navegador ou usou aba anônima
- [ ] Executou `node test-mercadopago-config.js`
- [ ] Copiou logs do teste
- [ ] Tentou checkout novamente
- [ ] Copiou logs do checkout
