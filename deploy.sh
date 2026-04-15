#!/bin/bash
set -euo pipefail

echo "Iniciando deploy do Agon..."

cd /var/www/agon/app

echo "Baixando atualizacoes..."
git fetch origin main
git reset --hard origin/main

echo "Instalando dependencias..."
npm ci

echo "Limpando cache de build..."
rm -rf .turbo apps/web/.next node_modules/.cache/turbo

echo "Buildando projeto..."
npm run build

echo "Recarregando aplicacao..."
pm2 reload agon-web --update-env || pm2 start npm --name agon-web -- run start --prefix apps/web
pm2 save

echo "Deploy concluido."
pm2 status
