#!/bin/bash
set -e

echo "🚀 Iniciando deploy do Agon..."

cd /var/www/agon/app

echo "📥 Baixando atualizações..."
git pull origin main

echo "📦 Instalando dependências..."
npm install

echo "🔨 Buildando projeto..."
npm run build

echo "♻️  Reiniciando aplicação..."
pm2 restart agon-web || pm2 start npm --name agon-web -- run start --prefix apps/web

echo "✅ Deploy concluído!"
pm2 status
