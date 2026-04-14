# Guia de Debug do Checkout - Produção VPS

## 🎯 Objetivo

Identificar **exatamente onde** o fluxo do checkout está quebrando antes de alterar qualquer lógica.

## 📋 Logs Instrumentados

### Middleware (`apps/web/src/middleware.ts`)
- `[MW] /checkout - START` - Middleware iniciou
- `[MW] /checkout - SESSION_CHECK: Xms, hasSession=true/false` - Verificação de sessão
- `[MW] /checkout - ALLOW: Xms` - Permitiu acesso
- `[MW] /checkout - REDIRECT to /login` - Redirecionou para login
- `[MW] /checkout - ERROR after Xms` - Erro no middleware

### Checkout Page (`apps/web/src/app/checkout/page.tsx`)
- `[CHECKOUT] START` - Página iniciou
- `[CHECKOUT] Client created: Xms` - Cliente Supabase criado
- `[CHECKOUT] Auth check: Xms, hasUser=true/false` - Verificação de autenticação
- `[CHECKOUT] Cart fetch: Xms, items=N` - Busca do carrinho
- `[CHECKOUT] RENDER with N items` - Renderizando página
- `[CHECKOUT] REDIRECT to /cart` - Redirecionou para carrinho

### Cart Page (`apps/web/src/app/cart/page.tsx`)
- `[CART] Click: Finalizar Compra, items=N` - Botão clicado

## 🧪 Testes Controlados

### Preparação
1. Fazer deploy com os logs instrumentados
2. Abrir terminal SSH na VPS
3. Monitorar logs em tempo real:
   ```bash
   # Se usando PM2
   pm2 logs --lines 100
   
   # Se usando systemd
   journalctl -u your-service -f
   
   # Ou logs do Next.js diretamente
   tail -f /var/www/agon/logs/app.log
   ```

### Teste A - Fluxo Normal
**Objetivo**: Ver o fluxo completo funcionando

1. Fazer login no site
2. Adicionar produto ao carrinho
3. Ir para `/cart`
4. Clicar em "Finalizar Compra"
5. **Anotar todos os logs que aparecem**

**Logs esperados (sucesso)**:
```
[CART] Click: Finalizar Compra, items=1
[MW] /checkout - START
[MW] /checkout - SESSION_CHECK: 150ms, hasSession=true
[MW] /checkout - ALLOW: 152ms
[CHECKOUT] START
[CHECKOUT] Client created: 50ms
[CHECKOUT] Auth check: 200ms, hasUser=true, hasError=false
[CHECKOUT] Cart fetch: 350ms, items=1, hasError=false
[CHECKOUT] RENDER with 1 items: 355ms
```

### Teste B - Acesso Direto
**Objetivo**: Verificar se middleware protege corretamente

1. Abrir nova aba anônima (ou limpar cookies)
2. Acessar diretamente `https://seu-site.com/checkout`
3. **Anotar todos os logs que aparecem**

**Logs esperados (sem sessão)**:
```
[MW] /checkout - START
[MW] /checkout - SESSION_CHECK: 150ms, hasSession=false
[MW] /checkout - ALLOW: 152ms
[CHECKOUT] START
[CHECKOUT] Client created: 50ms
[CHECKOUT] Auth check: 200ms, hasUser=false, hasError=false
[CHECKOUT] REDIRECT to /login (no auth)
```

### Teste C - Repetição Rápida
**Objetivo**: Detectar problemas de race condition ou cache

1. Estar logado com carrinho preenchido
2. Acessar `/checkout` 5 vezes seguidas rapidamente
3. **Anotar quantas vezes funcionou vs. falhou**
4. **Anotar padrão nos logs**

## 📊 Análise de Resultados

### Caso 1: Middleware Instável (Mais Provável)

**Sinais**:
- `hasSession=false` mesmo estando logado
- Tempo de `SESSION_CHECK` varia muito (50ms vs 4000ms)
- Às vezes funciona, às vezes não

**Logs típicos**:
```
[MW] /checkout - SESSION_CHECK: 4800ms, hasSession=false  ❌
[MW] /checkout - ALLOW: 4802ms
[CHECKOUT] START
[CHECKOUT] Auth check: 200ms, hasUser=false  ❌
[CHECKOUT] REDIRECT to /login (no auth)
```

**Conclusão**: Middleware depende de algo instável (rede Supabase ou timeout muito curto)

**Próxima ação**: Aumentar timeout do middleware de 5s para 10s

---

### Caso 2: Sessão Inconsistente

**Sinais**:
- Middleware diz `hasSession=false`
- Mas checkout page diz `hasUser=true`
- Ou vice-versa

**Logs típicos**:
```
[MW] /checkout - SESSION_CHECK: 150ms, hasSession=false  ❌
[MW] /checkout - ALLOW: 152ms
[CHECKOUT] START
[CHECKOUT] Auth check: 200ms, hasUser=true  ✅ (inconsistente!)
```

**Conclusão**: Problema de cookies ou leitura de sessão entre middleware e server component

**Próxima ação**: Verificar configuração de cookies no Supabase client

---

### Caso 3: Middleware OK, Checkout Falha

**Sinais**:
- Middleware sempre encontra sessão
- Checkout não carrega corretamente
- Erro ao buscar carrinho

**Logs típicos**:
```
[MW] /checkout - SESSION_CHECK: 150ms, hasSession=true  ✅
[MW] /checkout - ALLOW: 152ms
[CHECKOUT] START
[CHECKOUT] Client created: 50ms
[CHECKOUT] Auth check: 200ms, hasUser=true, hasError=false  ✅
[CHECKOUT] Cart fetch: 5000ms, items=0, hasError=true  ❌
[CHECKOUT] REDIRECT to /cart
```

**Conclusão**: Problema na query do carrinho (RLS, timeout, ou dados)

**Próxima ação**: Verificar políticas RLS e performance da query

---

### Caso 4: Checkout Nunca Executa

**Sinais**:
- Não aparece nenhum log `[CHECKOUT]`
- Sempre redireciona antes
- Só aparece logs do middleware

**Logs típicos**:
```
[CART] Click: Finalizar Compra, items=1
[MW] /checkout - START
[MW] /checkout - SESSION_CHECK: 150ms, hasSession=false  ❌
[MW] /checkout - ALLOW: 152ms
(nenhum log de CHECKOUT aparece)
```

**Conclusão**: Middleware está permitindo (`ALLOW`), mas página não executa. Possível problema de roteamento ou build.

**Próxima ação**: Verificar se `/checkout/page.tsx` foi compilado corretamente no build

---

## 🚨 Regras Importantes

1. **NÃO alterar lógica ainda** - Apenas coletar dados
2. **NÃO aumentar timeout neste momento** - Primeiro entender o problema
3. **NÃO aplicar todas as mudanças de uma vez** - Fase de diagnóstico

## 📝 Template de Relatório

Após executar os testes, preencha:

```
### Teste A - Fluxo Normal
- Funcionou? [SIM/NÃO]
- Logs observados:
  [cole aqui]

### Teste B - Acesso Direto
- Funcionou? [SIM/NÃO]
- Logs observados:
  [cole aqui]

### Teste C - Repetição
- Taxa de sucesso: X/5
- Padrão observado:
  [descreva]

### Conclusão
- Caso identificado: [1/2/3/4]
- Próxima ação sugerida:
  [baseado na análise]
```

## 🔄 Próximos Passos

Após coletar os logs e identificar o caso:

1. **Reportar resultados** com o template acima
2. **Aguardar análise** antes de fazer mudanças
3. **Aplicar correção específica** baseada no caso identificado
4. **Testar novamente** para confirmar correção
