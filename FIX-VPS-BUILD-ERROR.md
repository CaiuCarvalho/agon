# 🔧 Fix VPS Build Error - Next.js 15 Params

## Problema

Erro no build do VPS:
```
Type error: Route "src/app/api/admin/orders/[id]/route.ts" has an invalid "GET" export:
Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

## Causa

Next.js 15 mudou a API de rotas dinâmicas. Os `params` agora precisam ser do tipo `Promise<{}>` e devem ser await.

## Solução

### Passo 1: Fazer Pull das Correções

No VPS, navegue até o diretório do projeto e faça pull:

```bash
cd /var/www/agon/app
git pull origin main
```

### Passo 2: Verificar Arquivos Corrigidos

Os seguintes arquivos foram corrigidos:

1. `apps/web/src/app/api/admin/orders/[id]/route.ts`
2. `apps/web/src/app/api/admin/orders/[id]/shipping/route.ts`
3. `apps/web/src/app/api/admin/products/[id]/route.ts`
4. `apps/web/src/app/api/admin/products/[id]/stock/route.ts`
5. `apps/web/src/app/api/admin/products/[id]/toggle/route.ts`

### Passo 3: Limpar Cache e Rebuild

```bash
cd /var/www/agon/app/apps/web

# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules se necessário (opcional)
# rm -rf node_modules
# npm install

# Build
npm run build
```

### Passo 4: Reiniciar PM2

```bash
pm2 restart agon-web
pm2 save
```

## Padrão de Correção

### ❌ ANTES (Errado - Next.js 14)
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await getOrderDetails(params.id);
  // ...
}
```

### ✅ DEPOIS (Correto - Next.js 15)
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;
  
  const result = await getOrderDetails(id);
  // ...
}
```

## Verificação

Após o build, verifique se não há erros:

```bash
# Verificar logs do PM2
pm2 logs agon-web --lines 50

# Testar a aplicação
curl http://localhost:3000
```

## Troubleshooting

### Se o erro persistir:

1. **Verificar versão do Next.js**:
   ```bash
   cd /var/www/agon/app/apps/web
   npm list next
   ```
   Deve ser: `next@15.5.14`

2. **Limpar completamente**:
   ```bash
   rm -rf .next
   rm -rf node_modules
   rm -rf .turbo
   npm install
   npm run build
   ```

3. **Verificar se o git pull funcionou**:
   ```bash
   git log -1
   git status
   ```

4. **Verificar conteúdo do arquivo**:
   ```bash
   cat apps/web/src/app/api/admin/orders/[id]/route.ts | grep "params:"
   ```
   Deve mostrar: `{ params }: { params: Promise<{ id: string }> }`

## Referência

- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Dynamic Routes API Changes](https://nextjs.org/docs/app/api-reference/file-conventions/route)

---

**Última atualização**: 10/04/2026
