#!/usr/bin/env bash
# Concatena todas as migrações de supabase/migrations em um único arquivo
# pronto para ser colado no SQL Editor do Supabase Dashboard.
#
# Uso:
#   ./scripts/build-migrations-sql.sh            # imprime no stdout
#   ./scripts/build-migrations-sql.sh > all.sql  # grava em all.sql
#
# Por padrão ignora APPLY_CHECKOUT_MIGRATIONS.sql (não é migração de
# timestamp; é só um recorte pré-existente).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/supabase/migrations"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "supabase/migrations not found at $MIGRATIONS_DIR" >&2
  exit 1
fi

cat <<'HEADER'
-- =============================================================================
-- AGON — CONSOLIDATED SUPABASE MIGRATIONS
-- Gerado por scripts/build-migrations-sql.sh
-- =============================================================================
-- Copie TODO este arquivo e rode uma vez no SQL Editor do projeto Supabase
-- (staging primeiro, depois produção). As migrações são idempotentes o
-- suficiente (usam IF NOT EXISTS / DROP POLICY IF EXISTS); rodar de novo
-- é seguro, mas prefira aplicar uma vez por ambiente.
-- =============================================================================

BEGIN;

HEADER

while IFS= read -r file; do
  # pula o consolidado pré-existente; queremos migrações de timestamp só
  if [[ "$(basename "$file")" == "APPLY_CHECKOUT_MIGRATIONS.sql" ]]; then
    continue
  fi
  printf -- '\n-- -----------------------------------------------------------------------------\n'
  printf -- '-- Migration: %s\n' "$(basename "$file")"
  printf -- '-- -----------------------------------------------------------------------------\n\n'
  cat "$file"
  printf '\n'
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort)

cat <<'FOOTER'

COMMIT;

-- =============================================================================
-- Após rodar este arquivo:
--   SELECT count(*) FROM public.products WHERE deleted_at IS NULL;
--   SELECT name, deleted_at FROM public.products ORDER BY name LIMIT 5;
-- =============================================================================
FOOTER
