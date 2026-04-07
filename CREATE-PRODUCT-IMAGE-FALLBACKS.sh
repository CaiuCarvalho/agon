#!/bin/bash
# Script para criar fallbacks de imagens de produtos usando product-jersey.jpg
# Execute na VPS: bash CREATE-PRODUCT-IMAGE-FALLBACKS.sh

echo "=========================================="
echo "Criando fallbacks de imagens de produtos"
echo "=========================================="
echo ""

cd /var/www/agon/app/apps/web/public/products

# Lista de imagens faltantes que precisam de fallback
MISSING_IMAGES=(
    "flamengo.jpg"
    "barcelona.jpg"
    "corinthians.jpg"
    "palmeiras.jpg"
    "sao-paulo.jpg"
    "brasil.jpg"
    "argentina.jpg"
    "real-madrid.jpg"
    "psg.jpg"
)

echo "Usando product-jersey.jpg como fallback..."
echo ""

for img in "${MISSING_IMAGES[@]}"; do
    if [ -f "$img" ]; then
        echo "✓ $img já existe, pulando..."
    else
        # Criar cópia (não link simbólico para evitar problemas com Next.js)
        cp product-jersey.jpg "$img"
        echo "✓ Criado: $img"
    fi
done

echo ""
echo "=========================================="
echo "Fallbacks criados com sucesso!"
echo "=========================================="
echo ""
echo "Arquivos criados:"
ls -lh flamengo.jpg barcelona.jpg corinthians.jpg palmeiras.jpg sao-paulo.jpg brasil.jpg argentina.jpg real-madrid.jpg psg.jpg 2>/dev/null || echo "Nenhum arquivo encontrado"
echo ""
echo "PRÓXIMO PASSO: Reinicie o PM2"
echo "pm2 restart agon-web"
