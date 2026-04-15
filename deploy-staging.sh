#!/bin/bash
set -euo pipefail

echo "Iniciando deploy do Agon [STAGING]..."

cd /var/www/agon/staging

echo "Baixando atualizacoes..."
git fetch origin staging
git reset --hard origin/staging

echo "Instalando dependencias..."
npm ci

echo "Limpando cache de build..."
rm -rf .turbo apps/web/.next node_modules/.cache/turbo

echo "Buildando projeto..."
npm run build

echo "Recarregando aplicacao..."
pm2 reload agon-staging --update-env || pm2 start npm --name agon-staging -- run start --prefix apps/web -- --port 30001
pm2 save

echo "Deploy staging concluido."
pm2 status
