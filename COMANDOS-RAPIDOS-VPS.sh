#!/bin/bash

# ========================================
# Comandos Rápidos para Diagnóstico VPS
# ========================================
# 
# Este script contém comandos úteis para diagnosticar
# e corrigir o erro 502 no checkout
#
# Uso: bash COMANDOS-RAPIDOS-VPS.sh [comando]
# 
# Comandos disponíveis:
#   diagnostic  - Executar diagnóstico completo
#   test-mp     - Testar configuração do Mercado Pago
#   check-env   - Verificar variáveis de ambiente
#   rebuild     - Rebuild e restart da aplicação
#   logs        - Ver logs do PM2
#   nginx-logs  - Ver logs do Nginx
#   fix-env     - Criar .env.local a partir do template
#   help        - Mostrar esta ajuda
# ========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo ""
  echo "========================================"
  echo "$1"
  echo "========================================"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Command: diagnostic
cmd_diagnostic() {
  print_header "Executando Diagnóstico Completo"
  
  if [ ! -f "diagnose-vps-env.js" ]; then
    print_error "Arquivo diagnose-vps-env.js não encontrado"
    echo "Execute este script a partir da raiz do projeto"
    exit 1
  fi
  
  cd apps/web
  node ../../diagnose-vps-env.js
  cd ../..
}

# Command: test-mp
cmd_test_mp() {
  print_header "Testando Configuração do Mercado Pago"
  
  if [ ! -f "test-mercadopago-vps.js" ]; then
    print_error "Arquivo test-mercadopago-vps.js não encontrado"
    exit 1
  fi
  
  cd apps/web
  node ../../test-mercadopago-vps.js
  cd ../..
}

# Command: check-env
cmd_check_env() {
  print_header "Verificando Variáveis de Ambiente"
  
  echo "Verificando arquivo .env.local..."
  if [ -f "apps/web/.env.local" ]; then
    print_success ".env.local existe"
    echo ""
    echo "Variáveis configuradas:"
    grep -E "^[A-Z_]+" apps/web/.env.local | grep -v "^#" | cut -d= -f1 | while read var; do
      if [ ! -z "$var" ]; then
        echo "  - $var"
      fi
    done
  else
    print_error ".env.local não encontrado"
    echo ""
    echo "Execute: bash $0 fix-env"
  fi
  
  echo ""
  echo "Verificando variáveis críticas..."
  
  cd apps/web
  
  # Check NEXT_PUBLIC_APP_URL
  if grep -q "^NEXT_PUBLIC_APP_URL=" .env.local 2>/dev/null; then
    APP_URL=$(grep "^NEXT_PUBLIC_APP_URL=" .env.local | cut -d= -f2)
    if [ ! -z "$APP_URL" ] && [ "$APP_URL" != "https://agonimports.com" ]; then
      print_success "NEXT_PUBLIC_APP_URL: $APP_URL"
    else
      print_warning "NEXT_PUBLIC_APP_URL: usando valor padrão"
    fi
  else
    print_error "NEXT_PUBLIC_APP_URL: não configurado"
  fi
  
  # Check MERCADOPAGO_ACCESS_TOKEN
  if grep -q "^MERCADOPAGO_ACCESS_TOKEN=" .env.local 2>/dev/null; then
    TOKEN=$(grep "^MERCADOPAGO_ACCESS_TOKEN=" .env.local | cut -d= -f2)
    if [ ! -z "$TOKEN" ] && [[ "$TOKEN" == APP_USR-* ]]; then
      MASKED_TOKEN="${TOKEN:0:20}...${TOKEN: -10}"
      print_success "MERCADOPAGO_ACCESS_TOKEN: $MASKED_TOKEN"
    else
      print_error "MERCADOPAGO_ACCESS_TOKEN: formato inválido"
    fi
  else
    print_error "MERCADOPAGO_ACCESS_TOKEN: não configurado"
  fi
  
  cd ../..
}

# Command: rebuild
cmd_rebuild() {
  print_header "Rebuild e Restart da Aplicação"
  
  echo "1. Instalando dependências..."
  npm install
  
  echo ""
  echo "2. Building aplicação..."
  cd apps/web
  npm run build
  cd ../..
  
  echo ""
  echo "3. Restartando PM2..."
  pm2 restart all
  
  echo ""
  echo "4. Verificando status..."
  pm2 status
  
  print_success "Rebuild e restart concluídos"
  echo ""
  echo "Aguarde alguns segundos e teste o checkout"
}

# Command: logs
cmd_logs() {
  print_header "Logs do PM2"
  
  echo "Mostrando últimas 50 linhas..."
  echo ""
  pm2 logs --lines 50 --nostream
  
  echo ""
  echo "Para ver logs em tempo real, execute:"
  echo "  pm2 logs"
}

# Command: nginx-logs
cmd_nginx_logs() {
  print_header "Logs do Nginx"
  
  echo "Últimos erros 502..."
  echo ""
  sudo grep "502" /var/log/nginx/error.log | tail -20
  
  echo ""
  echo "Para ver logs em tempo real, execute:"
  echo "  sudo tail -f /var/log/nginx/error.log"
}

# Command: fix-env
cmd_fix_env() {
  print_header "Criando .env.local a partir do template"
  
  if [ -f "apps/web/.env.local" ]; then
    print_warning ".env.local já existe"
    echo ""
    read -p "Deseja sobrescrever? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Operação cancelada"
      exit 0
    fi
    
    # Backup
    cp apps/web/.env.local apps/web/.env.local.backup
    print_success "Backup criado: .env.local.backup"
  fi
  
  # Copy template
  cp apps/web/.env.production apps/web/.env.local
  print_success ".env.local criado a partir do template"
  
  echo ""
  echo "IMPORTANTE: Edite o arquivo e configure as variáveis:"
  echo "  nano apps/web/.env.local"
  echo ""
  echo "Variáveis obrigatórias:"
  echo "  - NEXT_PUBLIC_APP_URL"
  echo "  - MERCADOPAGO_ACCESS_TOKEN"
  echo "  - NEXT_PUBLIC_SUPABASE_URL"
  echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo ""
  echo "Após editar, execute:"
  echo "  bash $0 rebuild"
}

# Command: help
cmd_help() {
  echo "Comandos Rápidos para Diagnóstico VPS"
  echo ""
  echo "Uso: bash $0 [comando]"
  echo ""
  echo "Comandos disponíveis:"
  echo "  diagnostic   - Executar diagnóstico completo"
  echo "  test-mp      - Testar configuração do Mercado Pago"
  echo "  check-env    - Verificar variáveis de ambiente"
  echo "  rebuild      - Rebuild e restart da aplicação"
  echo "  logs         - Ver logs do PM2"
  echo "  nginx-logs   - Ver logs do Nginx"
  echo "  fix-env      - Criar .env.local a partir do template"
  echo "  help         - Mostrar esta ajuda"
  echo ""
  echo "Exemplos:"
  echo "  bash $0 diagnostic"
  echo "  bash $0 test-mp"
  echo "  bash $0 rebuild"
}

# Main
case "$1" in
  diagnostic)
    cmd_diagnostic
    ;;
  test-mp)
    cmd_test_mp
    ;;
  check-env)
    cmd_check_env
    ;;
  rebuild)
    cmd_rebuild
    ;;
  logs)
    cmd_logs
    ;;
  nginx-logs)
    cmd_nginx_logs
    ;;
  fix-env)
    cmd_fix_env
    ;;
  help|"")
    cmd_help
    ;;
  *)
    print_error "Comando desconhecido: $1"
    echo ""
    cmd_help
    exit 1
    ;;
esac
