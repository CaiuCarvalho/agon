#!/bin/bash

# ========================================
# Script Interativo de Configuração de Variáveis de Ambiente
# ========================================
# 
# Este script ajuda a configurar as variáveis de ambiente
# necessárias para o checkout funcionar na VPS
#
# Uso: bash configure-env-vps.sh
# ========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running in correct directory
if [ ! -f "package.json" ]; then
  print_error "Este script deve ser executado a partir da raiz do projeto"
  echo "Navegue até o diretório do projeto e execute novamente"
  exit 1
fi

print_header "Configuração de Variáveis de Ambiente - VPS"

echo "Este script irá ajudá-lo a configurar as variáveis de ambiente"
echo "necessárias para o checkout funcionar corretamente na VPS."
echo ""

# Check if .env.local already exists
ENV_FILE="apps/web/.env.local"

if [ -f "$ENV_FILE" ]; then
  print_warning "Arquivo .env.local já existe"
  echo ""
  read -p "Deseja sobrescrever? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Operação cancelada. Para editar manualmente:"
    echo "  nano $ENV_FILE"
    exit 0
  fi
  
  # Backup
  BACKUP_FILE="$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$ENV_FILE" "$BACKUP_FILE"
  print_success "Backup criado: $BACKUP_FILE"
  echo ""
fi

# Start configuration
print_header "Passo 1: URL da Aplicação"

echo "Digite a URL base da sua aplicação (ex: https://agonimports.com)"
echo "Esta URL será usada para gerar os links de retorno após o pagamento"
echo ""
read -p "NEXT_PUBLIC_APP_URL: " APP_URL

# Validate URL
if [ -z "$APP_URL" ]; then
  print_error "URL não pode estar vazia"
  exit 1
fi

if [[ ! "$APP_URL" =~ ^https?:// ]]; then
  print_warning "URL deve começar com http:// ou https://"
  read -p "Continuar mesmo assim? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

print_success "URL configurada: $APP_URL"

# Mercado Pago Token
print_header "Passo 2: Token do Mercado Pago"

echo "Digite o Access Token do Mercado Pago"
echo ""
print_info "Como obter o token:"
echo "  1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials"
echo "  2. Escolha 'Credenciais de produção' (ou 'Credenciais de teste' para sandbox)"
echo "  3. Copie o 'Access Token'"
echo ""
print_warning "O token deve começar com: APP_USR-"
echo ""
read -p "MERCADOPAGO_ACCESS_TOKEN: " MP_TOKEN

# Validate token
if [ -z "$MP_TOKEN" ]; then
  print_error "Token não pode estar vazio"
  exit 1
fi

if [[ ! "$MP_TOKEN" =~ ^APP_USR- ]]; then
  print_error "Token inválido: deve começar com APP_USR-"
  echo ""
  print_info "Verifique se você copiou o token correto do painel do Mercado Pago"
  exit 1
fi

print_success "Token configurado"

# Supabase URL
print_header "Passo 3: Supabase URL"

echo "Digite a URL do seu projeto Supabase"
echo "Exemplo: https://seu-projeto.supabase.co"
echo ""
read -p "NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL

# Validate Supabase URL
if [ -z "$SUPABASE_URL" ]; then
  print_error "URL do Supabase não pode estar vazia"
  exit 1
fi

if [[ ! "$SUPABASE_URL" =~ supabase\.co$ ]]; then
  print_warning "URL não parece ser do Supabase (deve terminar com supabase.co)"
  read -p "Continuar mesmo assim? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

print_success "URL do Supabase configurada"

# Supabase Anon Key
print_header "Passo 4: Supabase Anon Key"

echo "Digite a chave anônima (anon key) do Supabase"
echo "Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""
read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_KEY

# Validate Supabase Key
if [ -z "$SUPABASE_KEY" ]; then
  print_error "Chave do Supabase não pode estar vazia"
  exit 1
fi

if [[ ! "$SUPABASE_KEY" =~ ^eyJ ]]; then
  print_warning "Chave não parece ser um JWT válido (deve começar com eyJ)"
  read -p "Continuar mesmo assim? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

print_success "Chave do Supabase configurada"

# Optional: Webhook Secret
print_header "Passo 5: Webhook Secret (Opcional)"

echo "Digite o Webhook Secret do Mercado Pago (opcional)"
echo "Deixe em branco se ainda não configurou webhooks"
echo ""
read -p "MERCADOPAGO_WEBHOOK_SECRET (Enter para pular): " WEBHOOK_SECRET

if [ -z "$WEBHOOK_SECRET" ]; then
  print_info "Webhook secret não configurado (pode ser adicionado depois)"
  WEBHOOK_SECRET="your-webhook-secret-here"
else
  print_success "Webhook secret configurado"
fi

# Create .env.local file
print_header "Criando arquivo .env.local"

cat > "$ENV_FILE" << EOF
# Production Environment Variables
# Configurado automaticamente em $(date)

# =============================================================================
# Application URL
# =============================================================================
NEXT_PUBLIC_APP_URL=$APP_URL

# =============================================================================
# Mercado Pago Configuration
# =============================================================================
# Documentação: https://www.mercadopago.com.br/developers/pt/docs
MERCADOPAGO_ACCESS_TOKEN=$MP_TOKEN
MERCADOPAGO_WEBHOOK_SECRET=$WEBHOOK_SECRET

# =============================================================================
# Supabase Configuration
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY

# =============================================================================
# Node Environment
# =============================================================================
NODE_ENV=production
EOF

print_success "Arquivo .env.local criado com sucesso"

# Show summary
print_header "Resumo da Configuração"

echo "Variáveis configuradas:"
echo ""
echo "  ✓ NEXT_PUBLIC_APP_URL"
echo "  ✓ MERCADOPAGO_ACCESS_TOKEN"
echo "  ✓ NEXT_PUBLIC_SUPABASE_URL"
echo "  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  ✓ NODE_ENV"

if [ "$WEBHOOK_SECRET" != "your-webhook-secret-here" ]; then
  echo "  ✓ MERCADOPAGO_WEBHOOK_SECRET"
else
  echo "  ⚠ MERCADOPAGO_WEBHOOK_SECRET (não configurado)"
fi

echo ""
print_success "Configuração concluída!"

# Next steps
print_header "Próximos Passos"

echo "1. Verificar a configuração:"
echo "   bash COMANDOS-RAPIDOS-VPS.sh check-env"
echo ""
echo "2. Testar conexão com Mercado Pago:"
echo "   bash COMANDOS-RAPIDOS-VPS.sh test-mp"
echo ""
echo "3. Rebuild e restart da aplicação:"
echo "   bash COMANDOS-RAPIDOS-VPS.sh rebuild"
echo ""
echo "4. Testar o checkout no navegador"
echo ""

print_info "Se precisar editar manualmente:"
echo "  nano $ENV_FILE"
echo ""

print_success "Tudo pronto! Execute os próximos passos acima."
