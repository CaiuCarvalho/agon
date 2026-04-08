#!/bin/bash

# ========================================
# SCRIPT DE CORREÇÃO AUTOMÁTICA
# ========================================
# Execute este script na VPS para corrigir tudo automaticamente
# ========================================

set -e  # Parar se houver erro

echo "========================================"
echo "CORREÇÃO AUTOMÁTICA - Erro 502 Checkout"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
PROJECT_PATH="/var/www/agon/app"
WEB_PATH="$PROJECT_PATH/apps/web"

echo "Projeto: $PROJECT_PATH"
echo ""

# 1. Verificar se estamos no diretório correto
echo "1. Verificando diretório..."
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}✗ Projeto não encontrado em $PROJECT_PATH${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Projeto encontrado${NC}"
echo ""

# 2. Verificar se .env.production existe
echo "2. Verificando .env.production..."
if [ ! -f "$WEB_PATH/.env.production" ]; then
    echo -e "${RED}✗ .env.production não encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env.production existe${NC}"
echo ""

# 3. Criar .env.local se não existir
echo "3. Criando .env.local..."
if [ -f "$WEB_PATH/.env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local já existe${NC}"
    read -p "Deseja sobrescrever? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Mantendo .env.local existente"
    else
        cp "$WEB_PATH/.env.production" "$WEB_PATH/.env.local"
        echo -e "${GREEN}✓ .env.local sobrescrito${NC}"
    fi
else
    cp "$WEB_PATH/.env.production" "$WEB_PATH/.env.local"
    echo -e "${GREEN}✓ .env.local criado${NC}"
fi
echo ""

# 4. Mostrar variáveis que precisam ser configuradas
echo "4. Variáveis que precisam ser configuradas:"
echo "========================================
IMPORTANTE: Edite o arquivo .env.local e configure:

NEXT_PUBLIC_APP_URL=https://agonimports.com
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production

Onde obter:
- Token Mercado Pago: https://www.mercadopago.com.br/developers/panel/credentials
- Supabase: https://app.supabase.com (Settings → API)
========================================"
echo ""

read -p "Deseja editar .env.local agora? (Y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    nano "$WEB_PATH/.env.local"
fi
echo ""

# 5. Verificar se variáveis foram configuradas
echo "5. Verificando variáveis configuradas..."
if grep -q "APP_USR-your-access-token-here" "$WEB_PATH/.env.local"; then
    echo -e "${YELLOW}⚠ MERCADOPAGO_ACCESS_TOKEN ainda não foi configurado${NC}"
    echo "Configure antes de continuar!"
    exit 1
fi

if grep -q "https://agonimports.com" "$WEB_PATH/.env.local"; then
    echo -e "${GREEN}✓ NEXT_PUBLIC_APP_URL configurado${NC}"
else
    echo -e "${YELLOW}⚠ NEXT_PUBLIC_APP_URL pode não estar configurado${NC}"
fi
echo ""

# 6. Fazer build
echo "6. Fazendo build do Next.js..."
echo "Isso pode demorar alguns minutos..."
cd "$WEB_PATH"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build concluído com sucesso${NC}"
else
    echo -e "${RED}✗ Build falhou${NC}"
    exit 1
fi
echo ""

# 7. Verificar se build foi criado
echo "7. Verificando build..."
if [ -d "$WEB_PATH/.next" ]; then
    echo -e "${GREEN}✓ Build .next criado${NC}"
    BUILD_ID=$(cat "$WEB_PATH/.next/BUILD_ID" 2>/dev/null || echo "não encontrado")
    echo "Build ID: $BUILD_ID"
else
    echo -e "${RED}✗ Build .next não foi criado${NC}"
    exit 1
fi
echo ""

# 8. Restart PM2
echo "8. Restartando PM2..."
cd "$PROJECT_PATH"
pm2 restart agon-web
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PM2 restartado${NC}"
else
    echo -e "${RED}✗ Falha ao restartar PM2${NC}"
    exit 1
fi
echo ""

# 9. Aguardar alguns segundos
echo "9. Aguardando aplicação iniciar..."
sleep 5
echo ""

# 10. Verificar status
echo "10. Verificando status..."
pm2 list
echo ""

# 11. Testar localhost
echo "11. Testando localhost:30000..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:30000)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Next.js respondendo na porta 30000${NC}"
else
    echo -e "${YELLOW}⚠ Next.js retornou código: $HTTP_CODE${NC}"
fi
echo ""

# 12. Ver logs recentes
echo "12. Logs recentes do PM2:"
echo "========================================"
pm2 logs agon-web --lines 20 --nostream
echo "========================================"
echo ""

# 13. Resumo
echo "========================================"
echo "RESUMO DA CORREÇÃO"
echo "========================================"
echo -e "${GREEN}✓ .env.local criado/atualizado${NC}"
echo -e "${GREEN}✓ Build do Next.js concluído${NC}"
echo -e "${GREEN}✓ PM2 restartado${NC}"
echo ""
echo "Próximos passos:"
echo "1. Teste no navegador: https://agonimports.com/cart"
echo "2. Adicione produtos e finalize o pedido"
echo "3. Deve redirecionar para o Mercado Pago"
echo ""
echo "Se ainda houver erro 502:"
echo "1. Verifique os logs: pm2 logs agon-web"
echo "2. Verifique Nginx: tail -50 /var/log/nginx/error.log"
echo "3. Verifique se Nginx aponta para porta 30000"
echo ""
echo "========================================"
echo "FIM"
echo "========================================"
