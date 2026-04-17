#!/bin/bash
set -euo pipefail

echo "Iniciando deploy do Agon (staging)..."

cd /var/www/agon-staging/app

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
pm2 reload agon-web-staging --update-env || pm2 start npm --name agon-web-staging --cwd apps/web -- run start -- -p 30001
pm2 save

echo "Deploy de staging concluido."
pm2 status
