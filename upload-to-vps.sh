#!/bin/bash

# ========================================
# Script de Upload para VPS
# ========================================
# 
# Este script faz upload de todos os arquivos
# de diagnóstico para a VPS
#
# Uso: bash upload-to-vps.sh [user@vps-ip] [path]
# Exemplo: bash upload-to-vps.sh root@192.168.1.100 /var/www/app
# ========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Check arguments
if [ $# -lt 2 ]; then
  print_error "Argumentos insuficientes"
  echo ""
  echo "Uso: bash $0 [user@vps-ip] [path]"
  echo ""
  echo "Exemplos:"
  echo "  bash $0 root@192.168.1.100 /var/www/app"
  echo "  bash $0 ubuntu@agonimports.com /home/ubuntu/app"
  echo ""
  exit 1
fi

VPS_HOST="$1"
VPS_PATH="$2"

print_header "Upload de Arquivos de Diagnóstico para VPS"

echo "Destino: $VPS_HOST:$VPS_PATH"
echo ""

# List of files to upload
FILES=(
  "diagnose-vps-env.js"
  "test-mercadopago-vps.js"
  "configure-env-vps.sh"
  "COMANDOS-RAPIDOS-VPS.sh"
  "GUIA-DIAGNOSTICO-VPS.md"
  "README-DIAGNOSTICO-502.md"
  "INICIO-AQUI.md"
)

# Check if files exist
print_info "Verificando arquivos locais..."
echo ""

MISSING_FILES=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    print_success "$file"
  else
    print_error "$file (não encontrado)"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo ""
  print_error "$MISSING_FILES arquivo(s) não encontrado(s)"
  echo "Execute este script a partir da raiz do projeto"
  exit 1
fi

echo ""
print_success "Todos os arquivos encontrados"

# Test SSH connection
print_info "Testando conexão SSH..."
echo ""

if ssh -o ConnectTimeout=5 -o BatchMode=yes "$VPS_HOST" exit 2>/dev/null; then
  print_success "Conexão SSH OK"
else
  print_error "Falha na conexão SSH"
  echo ""
  echo "Possíveis causas:"
  echo "  - Host incorreto"
  echo "  - Chave SSH não configurada"
  echo "  - Firewall bloqueando conexão"
  echo ""
  echo "Tente conectar manualmente:"
  echo "  ssh $VPS_HOST"
  echo ""
  exit 1
fi

# Upload files
print_header "Fazendo Upload dos Arquivos"

UPLOAD_SUCCESS=0
UPLOAD_FAILED=0

for file in "${FILES[@]}"; do
  echo -n "Uploading $file... "
  
  if scp -q "$file" "$VPS_HOST:$VPS_PATH/" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    UPLOAD_SUCCESS=$((UPLOAD_SUCCESS + 1))
  else
    echo -e "${RED}✗${NC}"
    UPLOAD_FAILED=$((UPLOAD_FAILED + 1))
  fi
done

echo ""

if [ $UPLOAD_FAILED -gt 0 ]; then
  print_error "$UPLOAD_FAILED arquivo(s) falharam no upload"
  echo ""
  echo "Verifique:"
  echo "  - Permissões do diretório: $VPS_PATH"
  echo "  - Espaço em disco na VPS"
  echo ""
  exit 1
fi

print_success "Todos os arquivos enviados com sucesso!"

# Make scripts executable
print_header "Configurando Permissões"

echo "Tornando scripts executáveis..."
echo ""

SCRIPTS=(
  "configure-env-vps.sh"
  "COMANDOS-RAPIDOS-VPS.sh"
)

for script in "${SCRIPTS[@]}"; do
  echo -n "chmod +x $script... "
  
  if ssh "$VPS_HOST" "cd $VPS_PATH && chmod +x $script" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC}"
  fi
done

echo ""
print_success "Permissões configuradas"

# Summary
print_header "Resumo"

echo "Arquivos enviados: $UPLOAD_SUCCESS"
echo "Destino: $VPS_HOST:$VPS_PATH"
echo ""

print_success "Upload concluído!"

# Next steps
print_header "Próximos Passos"

echo "1. Conectar na VPS:"
echo "   ssh $VPS_HOST"
echo ""
echo "2. Navegar até o diretório:"
echo "   cd $VPS_PATH"
echo ""
echo "3. Configurar variáveis de ambiente:"
echo "   bash configure-env-vps.sh"
echo ""
echo "4. Ou executar diagnóstico:"
echo "   bash COMANDOS-RAPIDOS-VPS.sh diagnostic"
echo ""

print_info "Leia INICIO-AQUI.md para instruções completas"
echo ""

# Offer to connect
read -p "Deseja conectar na VPS agora? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  print_info "Conectando na VPS..."
  echo ""
  ssh -t "$VPS_HOST" "cd $VPS_PATH && bash"
fi
