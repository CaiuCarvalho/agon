#!/bin/bash

# ========================================
# DIAGNÓSTICO COMPLETO DA VPS
# ========================================
# Execute este script na VPS e me envie o resultado completo
# ========================================

echo "========================================"
echo "DIAGNÓSTICO COMPLETO DA VPS"
echo "Data: $(date)"
echo "========================================"
echo ""

# 1. INFORMAÇÕES DO SISTEMA
echo "========================================
1. INFORMAÇÕES DO SISTEMA
========================================"
echo "Hostname: $(hostname)"
echo "Sistema Operacional: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
echo "Usuário atual: $(whoami)"
echo "Diretório atual: $(pwd)"
echo ""

# 2. PROCESSOS PM2
echo "========================================
2. PROCESSOS PM2
========================================"
pm2 list
echo ""
echo "Detalhes dos processos:"
pm2 jlist | python3 -m json.tool 2>/dev/null || pm2 jlist
echo ""

# 3. ESTRUTURA DE DIRETÓRIOS
echo "========================================
3. ESTRUTURA DE DIRETÓRIOS DO PROJETO
========================================"
echo "Procurando pelo projeto..."
echo ""

# Tentar encontrar o projeto
POSSIBLE_PATHS=(
    "/root/agon-mvp"
    "/var/www/agon-mvp"
    "/home/ubuntu/agon-mvp"
    "/opt/agon-mvp"
    "~/agon-mvp"
)

PROJECT_PATH=""
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        PROJECT_PATH="$path"
        echo "✓ Projeto encontrado em: $PROJECT_PATH"
        break
    fi
done

if [ -z "$PROJECT_PATH" ]; then
    echo "✗ Projeto não encontrado nos caminhos comuns"
    echo "Listando diretórios em /root:"
    ls -la /root/ 2>/dev/null || echo "Sem acesso a /root"
    echo ""
    echo "Listando diretórios em /var/www:"
    ls -la /var/www/ 2>/dev/null || echo "Sem acesso a /var/www"
    echo ""
    echo "Listando diretórios em /home:"
    ls -la /home/ 2>/dev/null || echo "Sem acesso a /home"
else
    echo ""
    echo "Estrutura do projeto:"
    echo "----------------------------------------"
    cd "$PROJECT_PATH"
    tree -L 2 -a 2>/dev/null || find . -maxdepth 2 -type d 2>/dev/null || ls -la
    echo ""
    
    # 4. ARQUIVOS .env
    echo "========================================"
    echo "4. ARQUIVOS .env NO PROJETO"
    echo "========================================"
    echo "Procurando arquivos .env..."
    find "$PROJECT_PATH" -name ".env*" -type f 2>/dev/null | while read file; do
        echo ""
        echo "Arquivo: $file"
        echo "Tamanho: $(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null) bytes"
        echo "Última modificação: $(stat -f%Sm "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null)"
        echo "Permissões: $(ls -la "$file" | awk '{print $1}')"
        echo "Conteúdo (variáveis apenas, sem valores):"
        grep -E "^[A-Z_]+" "$file" 2>/dev/null | cut -d= -f1 | sed 's/^/  - /' || echo "  (não foi possível ler)"
    done
    echo ""
    
    # 5. VERIFICAR apps/web/.env.local ESPECIFICAMENTE
    echo "========================================"
    echo "5. VERIFICAÇÃO DE apps/web/.env.local"
    echo "========================================"
    if [ -f "$PROJECT_PATH/apps/web/.env.local" ]; then
        echo "✓ Arquivo apps/web/.env.local EXISTE"
        echo "Tamanho: $(stat -f%z "$PROJECT_PATH/apps/web/.env.local" 2>/dev/null || stat -c%s "$PROJECT_PATH/apps/web/.env.local" 2>/dev/null) bytes"
        echo ""
        echo "Variáveis configuradas:"
        grep -E "^[A-Z_]+" "$PROJECT_PATH/apps/web/.env.local" 2>/dev/null | while read line; do
            var_name=$(echo "$line" | cut -d= -f1)
            var_value=$(echo "$line" | cut -d= -f2-)
            
            # Mascarar valores sensíveis
            if [[ "$var_name" == *"TOKEN"* ]] || [[ "$var_name" == *"KEY"* ]] || [[ "$var_name" == *"SECRET"* ]]; then
                if [ ! -z "$var_value" ]; then
                    masked="${var_value:0:20}...${var_value: -10}"
                    echo "  ✓ $var_name = $masked"
                else
                    echo "  ✗ $var_name = (VAZIO)"
                fi
            else
                echo "  ✓ $var_name = $var_value"
            fi
        done
    else
        echo "✗ Arquivo apps/web/.env.local NÃO EXISTE"
        echo ""
        echo "Verificando se .env.production existe:"
        if [ -f "$PROJECT_PATH/apps/web/.env.production" ]; then
            echo "✓ .env.production existe"
        else
            echo "✗ .env.production também não existe"
        fi
    fi
    echo ""
    
    # 6. ESTRUTURA DE apps/web
    echo "========================================"
    echo "6. ESTRUTURA DE apps/web"
    echo "========================================"
    if [ -d "$PROJECT_PATH/apps/web" ]; then
        echo "Conteúdo de apps/web:"
        ls -la "$PROJECT_PATH/apps/web" | head -30
        echo ""
        echo "Verificando .next (build):"
        if [ -d "$PROJECT_PATH/apps/web/.next" ]; then
            echo "✓ Build .next existe"
            echo "BUILD_ID: $(cat "$PROJECT_PATH/apps/web/.next/BUILD_ID" 2>/dev/null || echo "não encontrado")"
        else
            echo "✗ Build .next NÃO existe"
        fi
    else
        echo "✗ Diretório apps/web não encontrado"
    fi
    echo ""
    
    # 7. PACKAGE.JSON
    echo "========================================"
    echo "7. PACKAGE.JSON"
    echo "========================================"
    if [ -f "$PROJECT_PATH/package.json" ]; then
        echo "✓ package.json existe na raiz"
        echo "Nome: $(cat "$PROJECT_PATH/package.json" | grep '"name"' | head -1)"
        echo "Versão: $(cat "$PROJECT_PATH/package.json" | grep '"version"' | head -1)"
    fi
    
    if [ -f "$PROJECT_PATH/apps/web/package.json" ]; then
        echo "✓ package.json existe em apps/web"
        echo "Nome: $(cat "$PROJECT_PATH/apps/web/package.json" | grep '"name"' | head -1)"
        echo "Scripts:"
        cat "$PROJECT_PATH/apps/web/package.json" | grep -A 10 '"scripts"' | head -15
    fi
    echo ""
fi

# 8. NGINX
echo "========================================"
echo "8. CONFIGURAÇÃO DO NGINX"
echo "========================================"
echo "Status do Nginx:"
systemctl status nginx --no-pager 2>/dev/null || service nginx status 2>/dev/null || echo "Nginx não encontrado"
echo ""
echo "Configurações do Nginx:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "Diretório sites-enabled não encontrado"
echo ""
echo "Configuração do site:"
cat /etc/nginx/sites-enabled/agonimports 2>/dev/null || cat /etc/nginx/sites-enabled/default 2>/dev/null || echo "Configuração não encontrada"
echo ""

# 9. LOGS RECENTES
echo "========================================"
echo "9. LOGS RECENTES (últimas 20 linhas)"
echo "========================================"
echo "PM2 Logs:"
pm2 logs --lines 20 --nostream 2>/dev/null || echo "Não foi possível obter logs do PM2"
echo ""
echo "Nginx Error Log:"
tail -20 /var/log/nginx/error.log 2>/dev/null || echo "Não foi possível acessar logs do Nginx"
echo ""

# 10. VARIÁVEIS DE AMBIENTE DO PROCESSO
echo "========================================"
echo "10. VARIÁVEIS DE AMBIENTE DO PROCESSO PM2"
echo "========================================"
pm2 env 0 2>/dev/null | grep -E "(NEXT_PUBLIC|MERCADOPAGO|SUPABASE|NODE_ENV)" || echo "Não foi possível obter variáveis do PM2"
echo ""

# 11. TESTE DE CONECTIVIDADE
echo "========================================"
echo "11. TESTE DE CONECTIVIDADE"
echo "========================================"
echo "Testando localhost:3000..."
curl -I http://localhost:3000 2>/dev/null | head -5 || echo "Não foi possível conectar em localhost:3000"
echo ""
echo "Testando API do Mercado Pago..."
curl -I https://api.mercadopago.com 2>/dev/null | head -5 || echo "Não foi possível conectar com Mercado Pago"
echo ""

# 12. RESUMO
echo "========================================"
echo "12. RESUMO DO DIAGNÓSTICO"
echo "========================================"
echo "Projeto encontrado: $([ ! -z "$PROJECT_PATH" ] && echo "SIM ($PROJECT_PATH)" || echo "NÃO")"
echo ".env.local existe: $([ -f "$PROJECT_PATH/apps/web/.env.local" ] && echo "SIM" || echo "NÃO")"
echo "Build .next existe: $([ -d "$PROJECT_PATH/apps/web/.next" ] && echo "SIM" || echo "NÃO")"
echo "PM2 rodando: $(pm2 list | grep -q "online" && echo "SIM" || echo "NÃO")"
echo "Nginx rodando: $(systemctl is-active nginx 2>/dev/null || echo "DESCONHECIDO")"
echo ""
echo "========================================"
echo "FIM DO DIAGNÓSTICO"
echo "========================================"
