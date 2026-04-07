# Correção Rápida: Erro 502 no Checkout

## Problema Identificado ✅

O erro 502 **NÃO é do Mercado Pago** (credenciais estão corretas e API funcionando).

**Causa Real:** Next.js Image Optimization falhando ao processar imagens de produtos que não existem (404), causando crashes com erro LRUCache.

## Solução: Usar product-jersey.jpg como Fallback

Vamos criar cópias da camisa existente para os produtos sem imagem.

## Execute na VPS

```bash
cd /var/www/agon/app

# 1. Criar fallbacks de imagens
bash CREATE-PRODUCT-IMAGE-FALLBACKS.sh

# 2. Reiniciar PM2
pm2 restart agon-web

# 3. Limpar logs antigos
pm2 flush agon-web

# 4. Monitorar
pm2 logs agon-web --lines 30
```

## O Que o Script Faz

Cria cópias de `product-jersey.jpg` para:
- flamengo.jpg
- barcelona.jpg
- corinthians.jpg
- palmeiras.jpg
- sao-paulo.jpg
- brasil.jpg
- argentina.jpg
- real-madrid.jpg
- psg.jpg

## Verificação

Após executar:

1. **Limpe cache do navegador** (Ctrl+Shift+Delete) ou use aba anônima (Ctrl+Shift+N)
2. Acesse o site
3. Adicione produto ao carrinho
4. Vá para checkout
5. Finalize o pedido

## Resultado Esperado

✅ **Antes:** Erro 502 + crashes de LRUCache  
✅ **Depois:** Checkout funcionando normalmente, redirecionando para Mercado Pago

## Se Ainda Houver Erro

Execute e me envie a saída:

```bash
pm2 logs agon-web --lines 100 | grep -A 10 -B 5 "checkout\|mercado\|error"
```

## Substituir Imagens Depois

Quando tiver as imagens reais dos produtos, basta substituir os arquivos em:
```
/var/www/agon/app/apps/web/public/products/
```

E reiniciar:
```bash
pm2 restart agon-web
```
