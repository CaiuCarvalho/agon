# Mudanças de Instrumentação - Checkout Debug

## 📝 Resumo

Adicionados logs **mínimos e cirúrgicos** para diagnóstico do bug de redirecionamento no checkout. **Nenhuma lógica foi alterada**, apenas instrumentação.

## 🔧 Arquivos Modificados

### 1. `apps/web/src/middleware.ts`

**Mudanças**:
- Adicionado log de início: `[MW] /checkout - START`
- Adicionado log de verificação de sessão: `[MW] /checkout - SESSION_CHECK: Xms, hasSession=true/false`
- Adicionado log de permissão: `[MW] /checkout - ALLOW: Xms`
- Adicionado log de redirecionamento: `[MW] /checkout - REDIRECT to /login`
- Adicionado log de erro: `[MW] /checkout - ERROR after Xms`

**Impacto**: Zero. Apenas console.log, sem mudança de comportamento.

---

### 2. `apps/web/src/app/checkout/page.tsx`

**Mudanças**:
- Adicionado log de início: `[CHECKOUT] START`
- Adicionado log de criação do cliente: `[CHECKOUT] Client created: Xms`
- Adicionado log de autenticação: `[CHECKOUT] Auth check: Xms, hasUser=true/false`
- Adicionado log de busca do carrinho: `[CHECKOUT] Cart fetch: Xms, items=N`
- Adicionado log de renderização: `[CHECKOUT] RENDER with N items`
- Adicionado log de redirecionamento: `[CHECKOUT] REDIRECT to /cart`

**Impacto**: Zero. Apenas console.log, sem mudança de comportamento.

---

### 3. `apps/web/src/app/cart/page.tsx`

**Mudanças**:
- Adicionado log no onClick do botão: `[CART] Click: Finalizar Compra, items=N`

**Impacto**: Zero. Apenas console.log, sem mudança de comportamento.

---

## ✅ Garantias

1. **Nenhuma lógica alterada** - Todos os `if`, `redirect()`, e fluxos permanecem idênticos
2. **Apenas logs adicionados** - console.log não afeta comportamento
3. **Performance mínima** - Logs são síncronos e rápidos
4. **Produção-safe** - Logs podem ficar em produção temporariamente

## 🚀 Deploy

### Build e Deploy
```bash
# No diretório do projeto
npm run build

# Fazer upload para VPS
scp -r .next user@vps:/var/www/agon/apps/web/

# Reiniciar serviço
ssh user@vps "pm2 restart agon"
```

### Monitorar Logs
```bash
# SSH na VPS
ssh user@vps

# Ver logs em tempo real
pm2 logs agon --lines 100

# Ou se usar systemd
journalctl -u agon -f
```

## 🧪 Testes

Seguir o guia em `CHECKOUT-DEBUG-GUIDE.md`:

1. **Teste A**: Fluxo normal (login → carrinho → checkout)
2. **Teste B**: Acesso direto ao /checkout
3. **Teste C**: Repetição rápida (5x seguidas)

## 📊 Análise

Após coletar logs, identificar qual dos 4 casos:

1. **Middleware instável** (timeout/sessão inconsistente)
2. **Sessão inconsistente** (middleware vs server component)
3. **Middleware OK, checkout falha** (erro na query)
4. **Checkout nunca executa** (problema de roteamento)

## 🔄 Próximos Passos

1. Deploy das mudanças
2. Executar testes controlados
3. Coletar logs
4. Reportar resultados
5. **Aguardar análise antes de fazer correções**

---

## ⚠️ Importante

- **NÃO** alterar timeout ainda
- **NÃO** adicionar lógica nova
- **NÃO** fazer múltiplas mudanças de uma vez
- **APENAS** coletar dados para diagnóstico preciso
