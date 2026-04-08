#!/bin/bash

# ========================================
# CORREÇÃO: Erro de Porta - Checkout 502
# ========================================
# Este script corrige o problema de porta entre .env.local e PM2

set -e  # Para em caso de erro

PROJECT_PATH="/var/www/agon/app"
WEB_PATH="$PROJECT_PATH/apps/web"
ENV_FILE="$WEB_PATH/.env.local"
NGINX_CONFIG="/etc/nginx/sites-available/agon"
PORT=30000

echo "========================================"
echo "CORREÇÃO: Conflito de Porta (3000 → 30000)"
echo "========================================"
echo ""

# 1. Verificar se estamos no servidor correto
echo "1. Verificando ambiente..."
if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ ERRO: Projeto não encontrado em $PROJECT_PATH"
    exit 1
fi
echo "✓ Projeto encontrado"
echo ""

# 2. Backup do .env.local atual
echo "2. Fazendo backup do .env.local..."
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ Backup criado"
echo ""

# 3. Corrigir PORT no .env.local (remover duplicatas e definir corretamente)
echo "3. Corrigindo PORT no .env.local..."
# Remove todas as linhas PORT= existentes e adiciona a correta no final
grep -v "^PORT=" "$ENV_FILE" > "$ENV_FILE.tmp"
echo "PORT=$PORT" >> "$ENV_FILE.tmp"
mv "$ENV_FILE.tmp" "$ENV_FILE"
echo "✓ PORT definido como $PORT"
echo ""

# 4. Verificar configuração do Nginx
echo "4. Verificando Nginx..."
if [ -f "$NGINX_CONFIG" ]; then
    NGINX_PORT=$(grep -oP "proxy_pass\s+http://localhost:\K\d+" "$NGINX_CONFIG" | head -1)
    if [ "$NGINX_PORT" = "$PORT" ]; then
        echo "✓ Nginx já está configurado para porta $PORT"
    else
        echo "⚠ ATENÇÃO: Nginx está configurado para porta $NGINX_PORT"
        echo "  Será necessário ajustar manualmente em: $NGINX_CONFIG"
        echo "  Altere: proxy_pass http://localhost:$NGINX_PORT;"
        echo "  Para:   proxy_pass http://localhost:$PORT;"
    fi
else
    echo "⚠ Arquivo Nginx não encontrado em $NGINX_CONFIG"
fi
echo ""

# 5. Parar e remover processo PM2 atual
echo "5. Parando PM2..."
cd "$WEB_PATH"
pm2 stop agon-web 2>/dev/null || echo "  (processo já estava parado)"
pm2 delete agon-web 2>/dev/null || echo "  (processo já estava removido)"
echo "✓ PM2 limpo"
echo ""

# 6. Iniciar PM2 com porta correta
echo "6. Iniciando PM2 na porta $PORT..."
cd "$WEB_PATH"
PORT=$PORT pm2 start npm --name "agon-web" -- start
pm2 save
echo "✓ PM2 iniciado"
echo ""

# 7. Aguardar aplicação iniciar
echo "7. Aguardando aplicação iniciar (10 segundos)..."
sleep 10
echo ""

# 8. Verificar se o processo está escutando na porta correta
echo "8. Verificando porta $PORT..."
if netstat -tlnp | grep ":$PORT" > /dev/null; then
    echo "✓ Processo escutando na porta $PORT"
    netstat -tlnp | grep ":$PORT"
else
    echo "❌ ERRO: Nenhum processo escutando na porta $PORT"
    echo ""
    echo "Logs do PM2:"
    pm2 logs agon-web --lines 20 --nostream
    exit 1
fi
echo ""

# 9. Testar localhost
echo "9. Testando http://localhost:$PORT..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo "✓ Aplicação respondendo (HTTP $HTTP_CODE)"
else
    echo "⚠ Resposta HTTP: $HTTP_CODE"
fi
echo ""

# 10. Verificar variáveis de ambiente críticas
echo "10. Verificando variáveis de ambiente..."
cd "$WEB_PATH"
if grep -q "MERCADOPAGO_ACCESS_TOKEN=APP_USR-" "$ENV_FILE"; then
    echo "✓ MERCADOPAGO_ACCESS_TOKEN configurado"
else
    echo "⚠ MERCADOPAGO_ACCESS_TOKEN não encontrado ou inválido"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" "$ENV_FILE"; then
    echo "✓ NEXT_PUBLIC_SUPABASE_URL configurado"
else
    echo "⚠ NEXT_PUBLIC_SUPABASE_URL não encontrado"
fi

if grep -q "NEXT_PUBLIC_APP_URL=https://agonimports.com" "$ENV_FILE"; then
    echo "✓ NEXT_PUBLIC_APP_URL configurado"
else
    echo "⚠ NEXT_PUBLIC_APP_URL não configurado corretamente"
fi
echo ""

# 11. Status final
echo "========================================"
echo "STATUS FINAL"
echo "========================================"
pm2 status
echo ""

echo "========================================"
echo "✓ CORREÇÃO CONCLUÍDA"
echo "========================================"
echo ""
echo "PRÓXIMOS PASSOS:"
echo ""
echo "1. Se o Nginx estava configurado para porta diferente:"
echo "   sudo nano $NGINX_CONFIG"
echo "   (altere proxy_pass para http://localhost:$PORT)"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "2. Testar checkout no navegador:"
echo "   https://agonimports.com/cart"
echo ""
echo "3. Monitorar logs em tempo real:"
echo "   pm2 logs agon-web"
echo ""
echo "4. Ver logs do Nginx (se necessário):"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
