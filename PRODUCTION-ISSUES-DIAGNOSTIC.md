# 🔍 Diagnóstico de Problemas em Produção - Agon

**Data:** 2026-04-06  
**Servidor:** 187.127.13.56 (Ubuntu 24.04.4)  
**Ambiente:** Produção  

---

## 🚨 Problemas Identificados

### 1. ❌ CRÍTICO: 502 Bad Gateway no Checkout
**Endpoint:** `/api/checkout/create-order`  
**Impacto:** Bloqueando vendas completamente  
**Prioridade:** P0 - URGENTE

#### Possíveis Causas:
1. **Variáveis de ambiente ausentes no VPS**
   - `MERCADOPAGO_ACCESS_TOKEN` não configurado
   - `MERCADOPAGO_WEBHOOK_SECRET` não configurado
   - `NEXT_PUBLIC_APP_URL` incorreto ou ausente

2. **Timeout do Mercado Pago**
   - SDK configurado com timeout de 5000ms (5s)
   - Pode estar excedendo em produção

3. **Erro no RPC do Supabase**
   - Função `create_order_with_payment_atomic` pode não existir no banco de produção
   - Migrations podem não ter sido aplicadas corretamente

4. **Erro de conexão com Supabase**
   - Credenciais incorretas
   - Firewall bloqueando conexão

#### Diagnóstico Recomendado:
```bash
# No VPS, verificar variáveis de ambiente
cd /var/www/agon/app
cat apps/web/.env.local

# Verificar logs do PM2
pm2 logs agon-web --lines 100 | grep -i error

# Testar endpoint localmente no VPS
curl -X POST http://localhost:3000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -d '{"shippingInfo":{"shippingName":"Test","shippingAddress":"Test","shippingCity":"Test","shippingState":"SP","shippingZip":"12345-678","shippingPhone":"(11) 99999-9999","shippingEmail":"test@test.com"}}'
```

---

### 2. ❌ 404 Errors em Imagens de Produtos
**Impacto:** Produtos sem imagem, experiência ruim  
**Prioridade:** P1 - Alta

#### Problema:
Produtos estão usando URLs locais que não existem:
- `/products/product-ball.jpg`
- `/products/product-jersey.jpg`
- etc.

#### Causa:
Imagens estão em `apps/web/public/products/` mas produtos no banco referenciam `/products/` (sem o prefixo correto).

#### Solução:
Atualizar URLs das imagens no banco de dados para usar caminhos corretos ou Cloudinary.

---

### 3. ⚠️ Mensagens "Reconectando" Constantes
**Impacto:** Poluição de logs, possível impacto em performance  
**Prioridade:** P2 - Média

#### Problema:
Realtime subscription do Supabase está tentando reconectar constantemente.

#### Possíveis Causas:
1. Subscription configurada mas não necessária
2. Erro na configuração do Realtime
3. Limite de conexões atingido no plano Supabase

#### Solução:
Desabilitar ou melhorar tratamento de erros do Realtime.

---

### 4. ⚠️ Feature Ausente: Usar Endereço Salvo
**Impacto:** UX ruim, usuário precisa digitar endereço toda vez  
**Prioridade:** P2 - Média

#### Problema:
Checkout não oferece opção de usar endereço salvo do perfil.

#### Solução:
Adicionar botão "Usar endereço do perfil" no formulário de checkout.

---

## 🔧 Plano de Correção

### Fase 1: Corrigir 502 no Checkout (URGENTE)

#### Passo 1: Verificar Variáveis de Ambiente no VPS
```bash
ssh usuario@187.127.13.56
cd /var/www/agon/app
cat apps/web/.env.local
```

**Verificar se existem:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `MERCADOPAGO_ACCESS_TOKEN` (deve começar com `APP_USR-`)
- ✅ `MERCADOPAGO_WEBHOOK_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL` (deve ser `https://seu-dominio.com`)

**Se ausentes, adicionar:**
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao
MERCADOPAGO_WEBHOOK_SECRET=seu-secret-aqui
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

Depois reiniciar:
```bash
pm2 restart agon-web
```

#### Passo 2: Verificar Logs de Erro
```bash
pm2 logs agon-web --lines 200 | grep -A 10 "create-order"
```

Procurar por:
- `MERCADOPAGO_ACCESS_TOKEN is not configured`
- `Failed to create payment preference`
- `RPC error`
- `Timeout`

#### Passo 3: Verificar Migrations no Supabase
No painel do Supabase (produção), executar:
```sql
-- Verificar se RPC existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_order_with_payment_atomic';

-- Se não existir, aplicar migration:
-- supabase/migrations/20260405000005_create_order_atomic_rpc.sql
```

#### Passo 4: Aumentar Timeout do Mercado Pago
Se o problema for timeout, editar `mercadoPagoService.ts`:
```typescript
mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 10000 }, // Aumentar de 5000 para 10000
});
```

#### Passo 5: Adicionar Logs Detalhados (Temporário)
Adicionar logs extras em `create-order/route.ts` para debug:
```typescript
console.log('[DEBUG] Environment check:', {
  hasAccessToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
  hasWebhookSecret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
  hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
});
```

---

### Fase 2: Corrigir Imagens 404

#### Opção A: Atualizar URLs no Banco (Rápido)
```sql
-- No Supabase, atualizar URLs das imagens
UPDATE products 
SET image_url = '/images/products/' || SUBSTRING(image_url FROM '[^/]+$')
WHERE image_url LIKE '/products/%';
```

#### Opção B: Mover Imagens para Cloudinary (Recomendado)
1. Fazer upload das imagens para Cloudinary
2. Atualizar URLs no banco com URLs do Cloudinary
3. Remover imagens locais

---

### Fase 3: Corrigir "Reconectando"

#### Solução 1: Desabilitar Realtime (Se não usado)
Procurar por `supabase.channel()` ou `.on('postgres_changes')` no código e remover.

#### Solução 2: Melhorar Tratamento de Erros
Adicionar tratamento silencioso:
```typescript
const subscription = supabase
  .channel('changes')
  .on('postgres_changes', ...)
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      // Silenciar erro, não reconectar
      subscription.unsubscribe();
    }
  });
```

---

### Fase 4: Adicionar "Usar Endereço Salvo"

Modificar `ShippingForm.tsx`:
```typescript
// Adicionar botão
<button
  type="button"
  onClick={loadProfileAddress}
  className="text-sm text-blue-600 hover:underline"
>
  Usar endereço do perfil
</button>

// Função para carregar
const loadProfileAddress = async () => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('shipping_address, shipping_city, ...')
    .single();
  
  if (profile) {
    form.setValue('shippingAddress', profile.shipping_address);
    // ... outros campos
  }
};
```

---

## 📋 Checklist de Execução

### Urgente (Fazer Agora)
- [ ] Verificar variáveis de ambiente no VPS
- [ ] Verificar logs do PM2 para erro específico
- [ ] Verificar se migrations foram aplicadas no Supabase produção
- [ ] Testar endpoint localmente no VPS
- [ ] Corrigir problema identificado
- [ ] Testar checkout end-to-end

### Importante (Fazer Hoje)
- [ ] Corrigir URLs das imagens (Opção A ou B)
- [ ] Testar imagens carregando corretamente
- [ ] Investigar mensagens "Reconectando"
- [ ] Aplicar solução para Realtime

### Pode Esperar (Fazer Esta Semana)
- [ ] Implementar "Usar endereço salvo"
- [ ] Testar feature
- [ ] Deploy da feature

---

## 🎯 Resultado Esperado

Após correções:
- ✅ Checkout funcionando 100%
- ✅ Imagens de produtos carregando
- ✅ Sem mensagens de erro nos logs
- ✅ UX melhorada com endereço salvo

---

## 📞 Próximos Passos

1. **Executar diagnóstico no VPS** (comandos acima)
2. **Identificar causa raiz do 502**
3. **Aplicar correção específica**
4. **Testar em produção**
5. **Monitorar logs por 24h**

---

## 🔍 Comandos Úteis para Debug

```bash
# Ver logs em tempo real
pm2 logs agon-web --lines 0

# Ver apenas erros
pm2 logs agon-web --err

# Verificar status
pm2 status

# Reiniciar aplicação
pm2 restart agon-web

# Ver variáveis de ambiente (cuidado com secrets!)
pm2 env 0

# Testar conexão com Supabase
curl https://seu-projeto.supabase.co/rest/v1/

# Testar endpoint de checkout
curl -X POST http://localhost:3000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=seu-token" \
  -d '{"shippingInfo":{...}}'
```

---

**Status:** 🔴 Aguardando diagnóstico no VPS
