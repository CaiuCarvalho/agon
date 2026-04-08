#!/bin/bash

# Script rápido para verificar se Nginx precisa ser ajustado

NGINX_CONFIG="/etc/nginx/sites-available/agon"
EXPECTED_PORT=30000

echo "========================================"
echo "VERIFICAÇÃO: Configuração Nginx"
echo "========================================"
echo ""

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Arquivo não encontrado: $NGINX_CONFIG"
    echo ""
    echo "Procurando outros arquivos de configuração..."
    find /etc/nginx -name "*agon*" -o -name "*agonimports*"
    exit 1
fi

echo "Arquivo encontrado: $NGINX_CONFIG"
echo ""

echo "Linhas com proxy_pass:"
echo "----------------------------------------"
grep -n "proxy_pass" "$NGINX_CONFIG"
echo "----------------------------------------"
echo ""

NGINX_PORT=$(grep -oP "proxy_pass\s+http://localhost:\K\d+" "$NGINX_CONFIG" | head -1)

if [ -z "$NGINX_PORT" ]; then
    echo "⚠ Não foi possível detectar a porta no proxy_pass"
    echo ""
    echo "Conteúdo completo do arquivo:"
    cat "$NGINX_CONFIG"
elif [ "$NGINX_PORT" = "$EXPECTED_PORT" ]; then
    echo "✓ Nginx está configurado CORRETAMENTE para porta $EXPECTED_PORT"
    echo ""
    echo "Nenhuma ação necessária no Nginx."
else
    echo "❌ Nginx está configurado para porta $NGINX_PORT"
    echo "   Deveria ser: $EXPECTED_PORT"
    echo ""
    echo "AÇÃO NECESSÁRIA:"
    echo "1. Editar o arquivo:"
    echo "   sudo nano $NGINX_CONFIG"
    echo ""
    echo "2. Alterar:"
    echo "   proxy_pass http://localhost:$NGINX_PORT;"
    echo "   Para:"
    echo "   proxy_pass http://localhost:$EXPECTED_PORT;"
    echo ""
    echo "3. Testar e recarregar:"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
fi

echo ""
echo "========================================"
