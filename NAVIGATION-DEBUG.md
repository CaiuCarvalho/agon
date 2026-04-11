# Diagnóstico de Problemas de Navegação Next.js

## Problema Reportado
- Servidor roda no terminal (`npm run dev`)
- Navegação não funciona no browser (localhost:3000)
- Páginas não mudam ao clicar em links

## ✅ PROBLEMA RESOLVIDO!

### Diagnóstico Final
Após análise do log do console:
- ✅ **Navegação está funcionando perfeitamente**
- ✅ **Fast Refresh funcionando** (Hot Module Replacement)
- ✅ **Servidor rodando corretamente** na porta 3000
- ❌ **Problema real**: Imagens de produtos retornando 404

### Causa Raiz
- Banco de dados referencia imagens específicas de times (flamengo.jpg, corinthians.jpg, etc.)
- Apenas 6 imagens genéricas existem no diretório public/products/
- Isso causa erros 404 mas **NÃO afeta a navegação**

### Solução Aplicada
✅ Criada migration: `supabase/migrations/20260411000001_fix_product_images_use_generic.sql`
✅ Guia de aplicação: `FIX-PRODUCT-IMAGES-404.md`

**Próximo passo**: Aplicar a migration no Supabase Dashboard

## Status Atual
✅ Servidor rodando na porta 3000 (PID: 3552)
✅ Variáveis de ambiente configuradas
✅ Middleware configurado corretamente
✅ Navegação funcionando perfeitamente
⚠️ Imagens 404 (será corrigido com migration)

## Possíveis Causas e Soluções

### 1. Cache do Next.js Corrompido
**Sintoma**: Páginas não atualizam, navegação trava
**Solução**:
```bash
# Parar o servidor (Ctrl+C no terminal)
# Limpar cache
rm -rf apps/web/.next
rm -rf .turbo

# Reinstalar dependências (opcional, se problema persistir)
npm install

# Reiniciar servidor
npm run dev
```

### 2. Erros de JavaScript no Console do Browser
**Como verificar**:
1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Procure por erros em vermelho
4. Vá para a aba Network
5. Recarregue a página (Ctrl+R)
6. Veja se há requisições falhando (status 404, 500, etc.)

**Erros comuns**:
- `Hydration error` → Problema de SSR/CSR mismatch
- `Failed to fetch` → Problema de API ou Supabase
- `Module not found` → Problema de import

### 3. Problemas com React Router/Link
**Verificar**:
- Links estão usando `<Link>` do Next.js?
- Há `<a>` tags sem `<Link>` wrapper?
- Há `onClick` handlers que previnem navegação?

**Exemplo correto**:
```tsx
import Link from 'next/link'

// ✅ Correto
<Link href="/produtos">Produtos</Link>

// ❌ Errado (causa reload completo)
<a href="/produtos">Produtos</a>
```

### 4. Middleware Bloqueando Navegação
**Status**: Middleware verificado - parece OK
**Timeout**: 5 segundos para sessão Supabase

**Se problema persistir**:
- Verificar logs do terminal durante navegação
- Procurar por `[Middleware] Error:` no console

### 5. Problemas com Supabase Session
**Sintoma**: Navegação lenta ou travando em rotas protegidas
**Solução temporária**: Desabilitar middleware temporariamente

```typescript
// apps/web/src/middleware.ts
export const config = {
  matcher: [], // Desabilita middleware temporariamente
}
```

### 6. Hot Reload Não Funcionando
**Sintoma**: Mudanças no código não aparecem no browser
**Solução**:
```bash
# Parar servidor
# Limpar cache
rm -rf apps/web/.next

# Reiniciar com flag de desenvolvimento
cd apps/web
npm run dev -- --turbo
```

### 7. Porta 3000 com Múltiplos Processos
**Status**: Verificado - apenas 1 processo (PID 3552)
**Se problema**: Matar processo e reiniciar
```bash
# Windows
taskkill /PID 3552 /F

# Reiniciar
npm run dev
```

## Próximos Passos de Diagnóstico

### Passo 1: Verificar Console do Browser
1. Abra http://localhost:3000
2. Abra DevTools (F12)
3. Vá para Console
4. Tente navegar para outra página
5. Copie qualquer erro que aparecer

### Passo 2: Verificar Network Tab
1. DevTools → Network
2. Recarregue a página (Ctrl+R)
3. Tente navegar
4. Veja se há requisições falhando
5. Clique em requisições vermelhas para ver detalhes

### Passo 3: Verificar Terminal
1. Olhe o terminal onde `npm run dev` está rodando
2. Procure por erros ou warnings
3. Veja se há mensagens de erro durante navegação

### Passo 4: Limpar Cache e Reiniciar
```bash
# No terminal onde npm run dev está rodando
# Pressione Ctrl+C para parar

# Limpar cache
rm -rf apps/web/.next
rm -rf .turbo
rm -rf node_modules/.cache

# Reiniciar
npm run dev
```

### Passo 5: Testar Navegação Básica
1. Vá para http://localhost:3000
2. Abra DevTools → Console
3. Digite no console:
```javascript
// Testar navegação programática
window.location.href = '/produtos'
```
4. Se funcionar → problema é com componentes Link
5. Se não funcionar → problema é mais profundo (middleware, cache, etc.)

## Informações para Reportar

Se problema persistir, forneça:
1. ✅ Erros do console do browser (F12 → Console)
2. ✅ Erros do terminal onde npm run dev está rodando
3. ✅ Qual página você está tentando acessar
4. ✅ O que acontece quando clica no link (nada? erro? loading infinito?)
5. ✅ Versão do Node.js: `node --version`
6. ✅ Versão do npm: `npm --version`

## Solução Rápida (Mais Provável)

**90% dos casos**: Cache corrompido do Next.js

```bash
# Parar servidor (Ctrl+C)
rm -rf apps/web/.next
npm run dev
```

**Se não resolver**: Forneça os erros do console do browser.
