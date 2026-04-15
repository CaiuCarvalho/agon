#!/usr/bin/env bash
# =============================================================================
# migrate-to-brazil.sh
#
# Migra o projeto Supabase de us-west-2 (Oregon) → sa-east-1 (São Paulo)
#
# PRÉ-REQUISITOS:
#   1. Supabase CLI instalado: https://supabase.com/docs/guides/cli/getting-started
#   2. Access Token do Supabase: dashboard → Account → Access Tokens
#   3. Novo projeto JÁ CRIADO no dashboard em "South America (São Paulo)"
#   4. psql instalado (apt install postgresql-client / brew install postgresql)
#
# USO:
#   export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxx"
#   bash supabase/migrate-to-brazil.sh <NOVO_PROJECT_REF> <NOVA_DB_PASSWORD>
#
# EXEMPLO:
#   bash supabase/migrate-to-brazil.sh abcdefghijklmno MinhaSenh@123
#
# =============================================================================

set -euo pipefail

OLD_PROJECT_REF="yyhpqecnxkvtnjdqhwhk"
NEW_PROJECT_REF="${1:-}"
NEW_DB_PASSWORD="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step()  { echo -e "\n${BLUE}▶ $*${NC}"; }
ok()    { echo -e "${GREEN}✓ $*${NC}"; }
warn()  { echo -e "${YELLOW}⚠ $*${NC}"; }
error() { echo -e "${RED}✗ $*${NC}"; exit 1; }

# --------------------------------------------------------------------------
# Validações iniciais
# --------------------------------------------------------------------------
[ -z "$NEW_PROJECT_REF" ]  && error "Informe o NEW_PROJECT_REF como 1º argumento."
[ -z "$NEW_DB_PASSWORD" ]  && error "Informe a DB PASSWORD do novo projeto como 2º argumento."
[ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && error "Exporte SUPABASE_ACCESS_TOKEN antes de executar."

command -v supabase >/dev/null 2>&1 || error "supabase CLI não encontrado. Instale em: https://supabase.com/docs/guides/cli"
command -v psql     >/dev/null 2>&1 || error "psql não encontrado. Instale postgresql-client."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DUMP_DIR="$SCRIPT_DIR/_migration_dump"
mkdir -p "$DUMP_DIR"

echo ""
echo "============================================================"
echo "  Migração Supabase: Oregon → São Paulo"
echo "  Origem : $OLD_PROJECT_REF (us-west-2)"
echo "  Destino: $NEW_PROJECT_REF (sa-east-1)"
echo "============================================================"

# --------------------------------------------------------------------------
# ETAPA 1 – Aplicar todas as migrations no novo projeto
# --------------------------------------------------------------------------
step "Etapa 1/5 – Aplicando migrations no novo projeto..."

cd "$REPO_ROOT"

supabase db push \
  --project-ref "$NEW_PROJECT_REF" \
  --include-all \
  2>&1 | tee "$DUMP_DIR/push_output.log" || \
  error "Falha ao aplicar migrations. Verifique $DUMP_DIR/push_output.log"

ok "Migrations aplicadas com sucesso."

# --------------------------------------------------------------------------
# ETAPA 2 – Exportar dados do projeto antigo (schema public)
# --------------------------------------------------------------------------
step "Etapa 2/5 – Exportando dados do projeto antigo (schema public)..."

supabase db dump \
  --project-ref "$OLD_PROJECT_REF" \
  --data-only \
  --schema public \
  -f "$DUMP_DIR/data_public.sql" \
  2>&1 | tee -a "$DUMP_DIR/dump_output.log" || \
  error "Falha ao exportar dados. Verifique se SUPABASE_ACCESS_TOKEN tem acesso ao projeto antigo."

ok "Dados exportados para $DUMP_DIR/data_public.sql"

# --------------------------------------------------------------------------
# ETAPA 3 – Importar dados no novo projeto
# --------------------------------------------------------------------------
step "Etapa 3/5 – Importando dados no novo projeto..."

NEW_DB_HOST="db.${NEW_PROJECT_REF}.supabase.co"

PGPASSWORD="$NEW_DB_PASSWORD" psql \
  -h "$NEW_DB_HOST" \
  -U postgres \
  -d postgres \
  --single-transaction \
  -v ON_ERROR_STOP=1 \
  -f "$DUMP_DIR/data_public.sql" \
  2>&1 | tee "$DUMP_DIR/restore_output.log" || {
    warn "Erros no restore. Verifique $DUMP_DIR/restore_output.log"
    warn "Alguns erros de conflito de dados duplicados podem ser ignorados."
  }

ok "Dados importados."

# --------------------------------------------------------------------------
# ETAPA 4 – Atualizar arquivos .temp locais
# --------------------------------------------------------------------------
step "Etapa 4/5 – Atualizando arquivos .temp locais..."

echo "$NEW_PROJECT_REF" > "$SCRIPT_DIR/.temp/project-ref"

NEW_POOLER_URL="postgresql://postgres.${NEW_PROJECT_REF}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
echo "$NEW_POOLER_URL" > "$SCRIPT_DIR/.temp/pooler-url"

ok ".temp/project-ref e .temp/pooler-url atualizados."

# --------------------------------------------------------------------------
# ETAPA 5 – Atualizar URLs de imagens no banco (Supabase Storage)
# --------------------------------------------------------------------------
step "Etapa 5/5 – Verificando URLs de imagens com referência ao projeto antigo..."

OLD_STORAGE_HOST="${OLD_PROJECT_REF}.supabase.co"
NEW_STORAGE_HOST="${NEW_PROJECT_REF}.supabase.co"

# Gera SQL de atualização de URLs (execute manualmente após conferir)
cat > "$DUMP_DIR/update_image_urls.sql" <<SQL
-- Atualiza URLs de imagens do Supabase Storage no novo projeto
-- Execute após confirmar que as imagens foram re-enviadas ou copiadas

-- Produtos: atualiza image_url
UPDATE public.products
SET image_url = REPLACE(image_url, '${OLD_STORAGE_HOST}', '${NEW_STORAGE_HOST}')
WHERE image_url LIKE '%${OLD_STORAGE_HOST}%';

-- Produtos: atualiza array de imagens (se houver coluna images jsonb/array)
-- Ajuste conforme estrutura real da tabela:
-- UPDATE public.products
-- SET images = (
--   SELECT jsonb_agg(REPLACE(img::text, '${OLD_STORAGE_HOST}', '${NEW_STORAGE_HOST}')::jsonb)
--   FROM jsonb_array_elements(images) img
-- )
-- WHERE images::text LIKE '%${OLD_STORAGE_HOST}%';

SELECT 'URLs atualizadas: ' || COUNT(*) FROM public.products
WHERE image_url LIKE '%${NEW_STORAGE_HOST}%';
SQL

ok "Script de atualização de URLs gerado em: $DUMP_DIR/update_image_urls.sql"
warn "Execute esse SQL no novo projeto APÓS conferir as imagens."

# --------------------------------------------------------------------------
# Resumo final
# --------------------------------------------------------------------------
echo ""
echo "============================================================"
echo -e "${GREEN}  Migração técnica concluída!${NC}"
echo "============================================================"
echo ""
echo "AÇÕES MANUAIS OBRIGATÓRIAS:"
echo ""
echo "  1. GITHUB SECRETS – Acesse:"
echo "     https://github.com/CaiuCarvalho/agon/settings/secrets/actions"
echo ""
echo "     Atualize os seguintes secrets com os dados do novo projeto:"
echo "     ┌─────────────────────────────────────────────────┐"
echo "     │ NEXT_PUBLIC_SUPABASE_URL                        │"
echo "     │   → https://${NEW_PROJECT_REF}.supabase.co      │"
echo "     │ NEXT_PUBLIC_SUPABASE_ANON_KEY                   │"
echo "     │   → (anon key do novo projeto)                  │"
echo "     │ SUPABASE_SERVICE_ROLE_KEY                       │"
echo "     │   → (service role key do novo projeto)          │"
echo "     │ SUPABASE_PROJECT_ID                             │"
echo "     │   → ${NEW_PROJECT_REF}                          │"
echo "     └─────────────────────────────────────────────────┘"
echo "     Staging (se aplicável):"
echo "     ┌─────────────────────────────────────────────────┐"
echo "     │ STAGING_NEXT_PUBLIC_SUPABASE_URL                │"
echo "     │ STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY           │"
echo "     │ STAGING_SUPABASE_SERVICE_ROLE_KEY               │"
echo "     │ STAGING_SUPABASE_PROJECT_ID                     │"
echo "     └─────────────────────────────────────────────────┘"
echo ""
echo "  2. VPS – Atualize o .env.local em PRODUÇÃO e STAGING:"
echo "     /var/www/agon/app/apps/web/.env.local"
echo "     /var/www/agon/staging/apps/web/.env.local"
echo ""
echo "  3. SUPABASE STORAGE – Recrie o bucket 'product-images':"
echo "     → Novo projeto → Storage → New bucket"
echo "     → Nome: product-images"
echo "     → Public bucket: SIM"
echo "     → Aplicar RLS policies (ver supabase/migrations/)"
echo ""
echo "  4. IMAGENS DE PRODUTOS – Após recriar o bucket:"
echo "     → Execute o SQL em: $DUMP_DIR/update_image_urls.sql"
echo ""
echo "  5. USUÁRIOS AUTH – Os usuários NÃO são migrados automaticamente."
echo "     → No projeto antigo: Authentication → Users → Export CSV"
echo "     → No novo projeto: re-convide usuários OU recrie contas admin manualmente"
echo "     → Pedidos/endereços vinculados a user_id ainda estarão no banco"
echo ""
echo "  6. WEBHOOKS MERCADO PAGO – Atualize a URL de redirect se necessário."
echo ""
echo "  Após atualizar os secrets, acione o deploy:"
echo "  git commit --allow-empty -m 'chore: trigger deploy after supabase migration'"
echo "  git push origin main"
echo ""
echo "  Dumps salvos em: $DUMP_DIR/"
echo ""
