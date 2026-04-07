#!/bin/bash
# Script de diagnóstico para erro 502 no checkout
# Execute na VPS: bash DIAGNOSE-CHECKOUT-502.sh

echo "=========================================="
echo "DIAGNÓSTICO: Checkout 502 Error"
echo "=========================================="
echo ""

echo "1. Verificando variáveis de ambiente..."
echo "----------------------------------------"
cd /var/www/agon/app/apps/web

if [ -f .env.local ]; then
    echo "✓ Arquivo .env.local existe"
    echo ""
    echo "MERCADOPAGO_ACCESS_TOKEN:"
    grep "MERCADOPAGO_ACCESS_TOKEN" .env.local | sed 's/=.*/=***HIDDEN***/'
    echo ""
    echo "NEXT_PUBLIC_APP_URL:"
    grep "NEXT_PUBLIC_APP_URL" .env.local
    echo ""
    echo "MERCADOPAGO_WEBHOOK_SECRET:"
    grep "MERCADOPAGO_WEBHOOK_SECRET" .env.local | sed 's/=.*/=***HIDDEN***/'
else
    echo "✗ Arquivo .env.local NÃO ENCONTRADO!"
fi

echo ""
echo "2. Verificando formato do token..."
echo "----------------------------------------"
TOKEN=$(grep "MERCADOPAGO_ACCESS_TOKEN" .env.local 2>/dev/null | cut -d'=' -f2)
if [ -z "$TOKEN" ]; then
    echo "✗ Token não encontrado ou vazio"
elif [[ $TOKEN == APP_USR-* ]]; then
    echo "✓ Token tem formato correto (APP_USR-...)"
    echo "  Comprimento: ${#TOKEN} caracteres"
else
    echo "✗ Token NÃO tem formato correto (deve começar com APP_USR-)"
    echo "  Formato atual: ${TOKEN:0:10}..."
fi

echo ""
echo "3. Últimos logs do PM2 (checkout/mercado)..."
echo "----------------------------------------"
pm2 logs agon-web --lines 100 --nostream | grep -i -E "(checkout|mercado|preference|error|502)" | tail -30

echo ""
echo "4. Status do PM2..."
echo "----------------------------------------"
pm2 status agon-web

echo ""
echo "5. Testando conectividade com Mercado Pago API..."
echo "----------------------------------------"
if [ ! -z "$TOKEN" ]; then
    echo "Fazendo requisição de teste..."
    curl -s -w "\nHTTP Status: %{http_code}\n" \
         -H "Authorization: Bearer $TOKEN" \
         "https://api.mercadopago.com/v1/payment_methods" | head -20
else
    echo "✗ Token não disponível para teste"
fi

echo ""
echo "=========================================="
echo "DIAGNÓSTICO COMPLETO"
echo "=========================================="
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Verifique se MERCADOPAGO_ACCESS_TOKEN está configurado"
echo "2. Verifique se o token começa com 'APP_USR-'"
echo "3. Verifique se o teste de API retornou 200 (não 401/403)"
echo "4. Procure por erros específicos nos logs do PM2"
echo ""
