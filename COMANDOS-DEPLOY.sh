#!/bin/bash
# Comandos para Deploy - Imagens Seleção Brasileira
# Execute estes comandos na ordem

echo "========================================="
echo "DEPLOY: Imagens Seleção Brasileira"
echo "========================================="
echo ""

# 1. COMMIT E PUSH
echo "1. Commit e Push..."
git add .
git commit -m "feat: adicionar imagens da Seleção Brasileira

- Adicionar 8 imagens AVIF otimizadas para produto Brasil
- Corrigir validação de variáveis de ambiente para produção
- Preparar script SQL para galeria de imagens do produto
- Adicionar documentação completa de deploy"

git push origin main

echo "✅ Push concluído!"
echo ""

# 2. INSTRUÇÕES PARA VPS
echo "========================================="
echo "2. Execute na VPS:"
echo "========================================="
echo ""
echo "ssh usuario@seu-servidor"
echo "cd /caminho/do/projeto"
echo "git pull origin main"
echo "npm run build"
echo "pm2 restart agon-web"
echo ""

# 3. INSTRUÇÕES PARA BANCO DE DADOS
echo "========================================="
echo "3. Atualizar Banco de Dados:"
echo "========================================="
echo ""
echo "Acesse: https://yyhpqecnxkvtnjdqhwhk.supabase.co"
echo "Vá em: SQL Editor"
echo "Execute: supabase/update-brasil-product-images.sql"
echo ""

# 4. VERIFICAÇÃO
echo "========================================="
echo "4. Verificar Deploy:"
echo "========================================="
echo ""
echo "- Acesse: https://seu-dominio.com/products"
echo "- Verifique produto Brasil com nova imagem"
echo "- Acesse página do produto para ver galeria"
echo "- Limpe cache: Ctrl+F5"
echo ""

echo "========================================="
echo "✅ Deploy Preparado!"
echo "========================================="
