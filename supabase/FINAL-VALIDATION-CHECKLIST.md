# Final Validation Checklist - Supabase Security System

## Overview

Este checklist guia a validação completa do sistema de segurança do Supabase implementado para o e-commerce Agon. Todos os testes devem passar antes de considerar o sistema pronto para produção.

## Prerequisites

Antes de iniciar a validação, certifique-se de que:

- [ ] Todas as migrations foram aplicadas no Supabase
- [ ] Variáveis de ambiente estão configuradas (.env.local)
- [ ] Aplicação frontend está rodando localmente
- [ ] Você tem acesso ao Supabase Dashboard
- [ ] Você tem dois usuários de teste criados

## 1. End-to-End Flow Testing

### 1.1 Fluxo de Cadastro e Login

**Objetivo:** Validar que o fluxo completo de autenticação funciona corretamente.

**Steps:**
1. Acesse a página de cadastro
2. Crie uma nova conta com email válido
3. Verifique que recebeu email de confirmação (se configurado)
4. Faça login com as credenciais criadas
5. Verifique que foi redirecionado para a página principal

**Expected Result:**
- ✅ Cadastro bem-sucedido
- ✅ Login bem-sucedido
- ✅ JWT token presente no localStorage
- ✅ Usuário autenticado pode acessar páginas protegidas

### 1.2 Fluxo de Adicionar ao Carrinho

**Objetivo:** Validar que itens podem ser adicionados ao carrinho com segurança.

**Steps:**
1. Navegue para a página de produtos
2. Selecione um produto
3. Escolha tamanho e quantidade
4. Clique em "Adicionar ao Carrinho"
5. Verifique que o item aparece no carrinho
6. Tente adicionar o mesmo produto com mesmo tamanho novamente
7. Verifique que a quantidade foi incrementada (não duplicada)

**Expected Result:**
- ✅ Item adicionado com sucesso
- ✅ Quantidade incrementada corretamente em duplicatas
- ✅ Price snapshot capturado no momento da adição
- ✅ Constraints respeitados (quantity 1-99, size 1-10 chars)

### 1.3 Fluxo de Adicionar à Wishlist

**Objetivo:** Validar que itens podem ser adicionados à wishlist com limite de 20 itens.

**Steps:**
1. Navegue para a página de produtos
2. Clique no ícone de "favorito" em um produto
3. Verifique que o produto aparece na wishlist
4. Tente adicionar o mesmo produto novamente
5. Verifique que não há duplicação
6. Adicione 19 produtos adicionais (total 20)
7. Tente adicionar um 21º produto
8. Verifique que o sistema rejeita com mensagem apropriada

**Expected Result:**
- ✅ Produtos adicionados à wishlist
- ✅ Sem duplicação (unique constraint funciona)
- ✅ Limite de 20 itens respeitado
- ✅ Mensagem de erro clara ao atingir limite

## 2. Multi-User Isolation Testing

### 2.1 Isolamento de Carrinho

**Objetivo:** Validar que usuários não podem ver ou modificar carrinhos de outros usuários.

**Steps:**
1. **Como User 1:**
   - Faça login
   - Adicione 2-3 produtos ao carrinho
   - Anote os produtos adicionados
   - Faça logout

2. **Como User 2:**
   - Faça login com conta diferente
   - Verifique que o carrinho está vazio
   - Adicione produtos diferentes ao carrinho
   - Faça logout

3. **Como User 1 novamente:**
   - Faça login
   - Verifique que apenas seus produtos originais estão no carrinho
   - Produtos do User 2 NÃO devem aparecer

**Expected Result:**
- ✅ User 1 vê apenas seus próprios itens
- ✅ User 2 vê apenas seus próprios itens
- ✅ Sem vazamento de dados entre usuários
- ✅ RLS policies funcionando corretamente

### 2.2 Isolamento de Wishlist

**Objetivo:** Validar que usuários não podem ver ou modificar wishlists de outros usuários.

**Steps:**
1. **Como User 1:**
   - Adicione 3-5 produtos à wishlist
   - Faça logout

2. **Como User 2:**
   - Faça login
   - Verifique que a wishlist está vazia
   - Adicione produtos diferentes
   - Faça logout

3. **Como User 1 novamente:**
   - Faça login
   - Verifique que apenas seus produtos originais estão na wishlist

**Expected Result:**
- ✅ Isolamento completo entre usuários
- ✅ RLS policies funcionando

### 2.3 Teste de Tentativa de Acesso Não Autorizado

**Objetivo:** Validar que tentativas de burlar RLS são bloqueadas.

**Steps:**
1. Abra DevTools → Network tab
2. Faça login como User 1
3. Adicione um item ao carrinho
4. Capture o request no Network tab
5. Tente modificar o `user_id` no payload para outro UUID
6. Envie o request modificado

**Expected Result:**
- ✅ Request rejeitado com erro 403 ou RLS violation
- ✅ Item NÃO é criado com user_id de outro usuário
- ✅ RLS WITH CHECK clause funcionando

## 3. Migration Testing (localStorage → Database)

### 3.1 Migração de Carrinho

**Objetivo:** Validar que itens do localStorage são migrados corretamente para o banco.

**Steps:**
1. **Preparação (sem login):**
   - Adicione 2-3 produtos ao carrinho (localStorage)
   - Verifique que estão salvos em `localStorage.getItem('agon_cart')`
   - NÃO faça login ainda

2. **Migração:**
   - Faça login
   - Aguarde o processo de migração
   - Verifique que há um loading state durante migração

3. **Validação:**
   - Verifique que os itens aparecem no carrinho
   - Verifique que `localStorage.getItem('agon_cart')` foi limpo
   - Verifique que `localStorage.getItem('agon_migrated')` = true
   - Faça logout e login novamente
   - Verifique que os itens persistem (estão no banco)

**Expected Result:**
- ✅ Migração bem-sucedida
- ✅ localStorage limpo após sucesso
- ✅ Itens persistem no banco
- ✅ Idempotência (executar 2x não duplica)

### 3.2 Migração de Wishlist

**Objetivo:** Validar migração de wishlist com limite de 20 itens.

**Steps:**
1. **Preparação:**
   - Adicione 5 produtos à wishlist (localStorage)
   - NÃO faça login

2. **Migração:**
   - Faça login
   - Aguarde migração

3. **Validação:**
   - Verifique que os 5 produtos aparecem na wishlist
   - Verifique que localStorage foi limpo
   - Teste com 25 itens no localStorage
   - Verifique que apenas 20 são migrados

**Expected Result:**
- ✅ Migração respeita limite de 20 itens
- ✅ Itens excedentes são ignorados (não causam erro)
- ✅ localStorage limpo

### 3.3 Teste de Timeout de Migração

**Objetivo:** Validar comportamento quando migração demora muito.

**Steps:**
1. Simule rede lenta (DevTools → Network → Slow 3G)
2. Adicione itens ao localStorage
3. Faça login
4. Aguarde 10 segundos (timeout configurado)

**Expected Result:**
- ✅ Mensagem de erro após timeout
- ✅ localStorage preservado (não limpo)
- ✅ Usuário pode tentar novamente

## 4. Rate Limiting Testing

### 4.1 Teste de Limite de Requests

**Objetivo:** Validar que rate limiting bloqueia requests excessivos.

**Steps:**
1. Faça login
2. Abra DevTools → Console
3. Execute script para fazer 65 requests em 1 minuto:
```javascript
for (let i = 0; i < 65; i++) {
  fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: 'test', quantity: 1, size: 'M' })
  }).then(r => console.log(`Request ${i}: ${r.status}`));
}
```

**Expected Result:**
- ✅ Primeiros 60 requests: sucesso (200)
- ✅ Requests 61-65: rejeitados (429 Too Many Requests)
- ✅ Mensagem de erro clara

### 4.2 Teste de Reset de Rate Limit

**Objetivo:** Validar que rate limit reseta após 1 minuto.

**Steps:**
1. Atinja o rate limit (60 requests)
2. Aguarde 61 segundos
3. Faça uma nova request

**Expected Result:**
- ✅ Request bem-sucedida após 1 minuto
- ✅ Rate limit resetado

## 5. Security Validation

### 5.1 Validação de Logs (Sem Dados Sensíveis)

**Objetivo:** Validar que logs não expõem dados sensíveis.

**Steps:**
1. Acesse logs do servidor (se disponível)
2. Busque por padrões sensíveis:
   - Passwords
   - JWT tokens completos
   - Service Role Keys
   - Emails completos
   - CPF/Credit Card

**Expected Result:**
- ✅ Passwords: [REDACTED]
- ✅ Tokens: parcialmente mascarados
- ✅ Service Role Key: nunca aparece
- ✅ Emails: mascarados ou ausentes

### 5.2 Validação de Secrets no Código

**Objetivo:** Validar que secrets não estão hardcoded.

**Steps:**
1. Execute script de validação:
```bash
# No diretório raiz do projeto
grep -r "SUPABASE_SERVICE_ROLE_KEY" apps/web/src/
grep -r "eyJ[a-zA-Z0-9_-]*\." apps/web/src/
```

**Expected Result:**
- ✅ Nenhum resultado encontrado
- ✅ Secrets apenas em .env files
- ✅ .env files no .gitignore

### 5.3 Validação de Service Role Key no Frontend

**Objetivo:** Validar que Service Role Key não está exposta no frontend.

**Steps:**
1. Abra DevTools → Application → Local Storage
2. Busque por "service" ou "role"
3. Abra DevTools → Sources
4. Busque por "SERVICE_ROLE_KEY" no código bundle

**Expected Result:**
- ✅ Service Role Key NÃO encontrada
- ✅ Apenas ANON_KEY presente
- ✅ Frontend usa apenas chaves públicas

## 6. CI/CD Validation

### 6.1 Validação de RLS

**Objetivo:** Validar que script de validação de RLS funciona.

**Steps:**
1. Execute script:
```bash
npm run validate:rls
# ou
node scripts/validate-rls.ts
```

**Expected Result:**
- ✅ Script executa sem erros
- ✅ Confirma que RLS está ativo em cart_items e wishlist_items
- ✅ Confirma que todas as policies existem
- ✅ Confirma que policies usam auth.uid()

### 6.2 Validação de Constraints

**Objetivo:** Validar que constraints obrigatórios existem.

**Steps:**
1. Execute script:
```bash
npm run validate:constraints
# ou
node scripts/validate-constraints.ts
```

**Expected Result:**
- ✅ Unique constraints presentes
- ✅ Check constraints presentes
- ✅ Foreign keys com CASCADE presentes

### 6.3 Validação de Secrets

**Objetivo:** Validar que não há secrets commitados.

**Steps:**
1. Execute script:
```bash
bash scripts/check-secrets.sh
```

**Expected Result:**
- ✅ Nenhum secret encontrado no código
- ✅ .env files não commitados
- ✅ Exit code 0 (sucesso)

## 7. Performance Testing

### 7.1 Teste de Concorrência

**Objetivo:** Validar que operações concorrentes não causam race conditions.

**Steps:**
1. Abra 2 abas do navegador
2. Faça login com mesmo usuário em ambas
3. Em ambas as abas simultaneamente:
   - Adicione o mesmo produto ao carrinho
   - Clique "Adicionar" ao mesmo tempo

**Expected Result:**
- ✅ Quantidade final correta (soma das duas adições)
- ✅ Sem duplicação de itens
- ✅ INSERT ON CONFLICT funcionando

### 7.2 Teste de Carga Básica

**Objetivo:** Validar que sistema suporta múltiplos usuários.

**Steps:**
1. Simule 10 usuários simultâneos
2. Cada um adiciona 5 itens ao carrinho
3. Monitore tempo de resposta

**Expected Result:**
- ✅ Todas as operações bem-sucedidas
- ✅ Tempo de resposta < 2 segundos
- ✅ Sem erros de timeout

## 8. Troubleshooting

### Issue: Migração falha

**Possíveis causas:**
- Product_id inválido no localStorage
- Rede lenta (timeout)
- RLS policies não aplicadas

**Solução:**
1. Verifique logs do navegador (DevTools → Console)
2. Verifique que migrations foram aplicadas
3. Teste com rede normal

### Issue: Rate limit não funciona

**Possíveis causas:**
- Tabela rate_limit_log não criada
- Triggers não aplicados
- Função check_rate_limit não existe

**Solução:**
1. Execute migration 20260404000008
2. Verifique que triggers existem:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table IN ('cart_items', 'wishlist_items');
```

### Issue: RLS não bloqueia acesso

**Possíveis causas:**
- RLS não habilitado
- Policies não criadas
- Service Role Key sendo usada no frontend

**Solução:**
1. Verifique RLS ativo:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('cart_items', 'wishlist_items');
```
2. Verifique que frontend usa ANON_KEY

## 9. Final Checklist

Antes de considerar o sistema pronto para produção, confirme:

### Database
- [ ] Todas as migrations aplicadas
- [ ] RLS ativo em todas as tabelas sensíveis
- [ ] Todas as policies criadas e testadas
- [ ] Constraints funcionando
- [ ] Triggers funcionando
- [ ] RPC functions criadas

### Frontend
- [ ] Migração de localStorage funciona
- [ ] Timeout de migração implementado
- [ ] localStorage limpo após sucesso
- [ ] Service Role Key não exposta
- [ ] Apenas ANON_KEY usada

### Security
- [ ] RLS testado com múltiplos usuários
- [ ] Isolamento de dados validado
- [ ] Logs não expõem dados sensíveis
- [ ] Secrets não commitados
- [ ] Rate limiting funciona

### CI/CD
- [ ] Scripts de validação executam sem erros
- [ ] GitHub Actions configurado (se aplicável)
- [ ] ESLint security rules ativas

### Documentation
- [ ] Migration guide disponível
- [ ] RLS testing guide disponível
- [ ] Runbooks criados
- [ ] .env.example atualizado

## 10. Sign-off

**Testado por:** _________________  
**Data:** _________________  
**Ambiente:** [ ] Development [ ] Staging [ ] Production  
**Status:** [ ] Aprovado [ ] Reprovado  

**Observações:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Próximos passos:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
