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
#
# Após concatenar, passa pelo script make-bundle-idempotent.py para
# acrescentar DROP IF EXISTS antes de CREATE INDEX/TRIGGER/POLICY e
# ALTER TABLE ADD CONSTRAINT. Isso deixa o bundle seguro para rodar em
# prod, onde várias tabelas/índices/policies já existem de aplicação
# manual no Dashboard.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/supabase/migrations"
IDEMPOTENT_PY="${REPO_ROOT}/scripts/make-bundle-idempotent.py"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "supabase/migrations not found at $MIGRATIONS_DIR" >&2
  exit 1
fi
if [[ ! -f "$IDEMPOTENT_PY" ]]; then
  echo "make-bundle-idempotent.py not found at $IDEMPOTENT_PY" >&2
  exit 1
fi

{
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
} | python3 "$IDEMPOTENT_PY"
