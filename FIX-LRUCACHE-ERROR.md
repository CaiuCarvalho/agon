# Correção: Erro LRUCache Causando 502

## Problema Identificado

O erro 502 **NÃO é do Mercado Pago** (que está funcionando perfeitamente).

O problema real é o **Next.js Image Optimization** falhando ao processar imagens que não existem (404), causando crashes com:
```
Error: LRUCache: calculateSize returned 0, but size must be > 0
```

## Correções Aplicadas

### 1. next.config.js
- Adicionado `minimumCacheTTL` para evitar problemas de cache
- Configurado tratamento seguro de imagens

### 2. instrumentation.ts (NOVO)
- Handler global para `unhandledRejection`
- Handler global para `uncaughtException`
- Previne que erros de cache derrubem o servidor

## Deploy na VPS

Execute estes comandos na VPS:

```bash
cd /var/www/agon/app

# 1. Backup do .env.local
cp apps/web/.env.local apps/web/.env.local.backup

# 2. Pull do código atualizado
git pull origin main

# 3. Instalar dependências (caso necessário)
npm install

# 4. Limpar cache do Next.js
rm -rf apps/web/.next

# 5. Rebuild
npm run build

# 6. Reiniciar PM2
pm2 restart agon-web

# 7. Limpar logs antigos
pm2 flush agon-web

# 8. Monitorar logs
pm2 logs agon-web --lines 50
```

## Verificação

Após o deploy:

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete) ou use aba anônima
2. Acesse o site
3. Adicione produto ao carrinho
4. Vá para checkout
5. Preencha dados e finalize

## O Que Esperar

✅ **Antes:** Erro 502 + "Unexpected token '<', "<html><h"... is not valid JSON"  
✅ **Depois:** Checkout funcionando normalmente OU erro específico do Mercado Pago (se houver)

Os erros de LRUCache ainda podem aparecer nos logs, mas **não vão mais derrubar o servidor**.

## Próximos Passos (Opcional)

Para eliminar completamente os erros de LRUCache, adicione as imagens faltantes:

```bash
# Na VPS
cd /var/www/agon/app/apps/web/public/products

# Você precisa adicionar estas imagens:
# - flamengo.jpg
# - barcelona.jpg
# - corinthians.jpg
# - palmeiras.jpg
# - sao-paulo.jpg
# - brasil.jpg
# - argentina.jpg
# - real-madrid.jpg
# - psg.jpg
```

Mas isso não é urgente - o checkout vai funcionar mesmo sem essas imagens.

## Monitoramento

Após o deploy, monitore os logs:

```bash
# Ver logs em tempo real
pm2 logs agon-web

# Ver apenas erros
pm2 logs agon-web --err

# Ver status
pm2 status
```

Se ainda houver erro 502, execute:
```bash
pm2 logs agon-web --lines 200 | grep -A 10 -B 5 "checkout\|error"
```

E me envie a saída.
