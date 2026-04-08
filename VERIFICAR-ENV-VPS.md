# Como Verificar Variáveis de Ambiente no VPS

## 🔍 Comandos para Verificar Configurações Atuais

### 1. Verificar se existe arquivo .env.local

```bash
# Conectar no VPS
ssh usuario@seu-servidor

# Ir para a pasta do projeto
cd /caminho/do/projeto/apps/web

# Listar arquivos .env (incluindo ocultos)
ls -la | grep env

# Você deve ver algo como:
# .env.local
# .env.production
# .env.example
```

### 2. Ver conteúdo do arquivo .env.local

```bash
# Ver o conteúdo completo
cat .env.local

# Ou ver apenas variáveis específicas
cat .env.local | grep NEXT_PUBLIC_APP_URL
cat .env.local | grep MERCADOPAGO
cat .env.local | grep SUPABASE
```

### 3. Verificar variáveis carregadas pelo PM2

```bash
# Listar processos PM2
pm2 list

# Ver variáveis de ambiente de um processo específico
pm2 env 0  # substitua 0 pelo ID do processo

# Ver informações detalhadas do processo
pm2 show web  # ou o nome do seu processo

# Ver logs em tempo real (pode mostrar variáveis)
pm2 logs web --lines 100
```

### 4. Verificar variáveis no processo Node.js em execução

```bash
# Ver variáveis de ambiente do processo
pm2 env web | grep NEXT_PUBLIC_APP_URL
pm2 env web | grep MERCADOPAGO
```

### 5. Testar se as variáveis estão sendo lidas

Crie um script temporário de teste:

```bash
# No VPS, na pasta apps/web
nano test-env.js
```

Cole este conteúdo:

```javascript
// test-env.js
console.log('=== Variáveis de Ambiente ===');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('MERCADOPAGO_ACCESS_TOKEN:', process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Configurado ✓' : 'NÃO configurado ✗');
console.log('MERCADOPAGO_WEBHOOK_SECRET:', process.env.MERCADOPAGO_WEBHOOK_SECRET ? 'Configurado ✓' : 'NÃO configurado ✗');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=============================');
```

Execute:

```bash
node test-env.js
```

---

## 🔧 Comandos Úteis para Diagnóstico

### Verificar estrutura de pastas
```bash
# Ver estrutura do projeto
tree -L 3 -a

# Ou sem tree instalado
find . -maxdepth 3 -name "*.env*"
```

### Verificar permissões dos arquivos
```bash
ls -la .env*
# Deve mostrar algo como:
# -rw-r--r-- 1 user user 1234 Apr 7 10:00 .env.local
```

### Verificar se PM2 está usando ecosystem.config.js
```bash
# Ver se existe ecosystem.config.js
ls -la ecosystem.config.js

# Ver conteúdo
cat ecosystem.config.js
```

### Verificar logs do servidor
```bash
# Logs do PM2
pm2 logs web --lines 50

# Logs do sistema (se usar systemd)
sudo journalctl -u agon-web -n 50

# Logs do Nginx (se aplicável)
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 Checklist de Diagnóstico

Execute estes comandos em ordem e anote os resultados:

```bash
# 1. Verificar se .env.local existe
echo "=== 1. Verificando .env.local ==="
ls -la /caminho/do/projeto/apps/web/.env.local

# 2. Ver conteúdo (sem mostrar senhas completas)
echo "=== 2. Conteúdo do .env.local ==="
cat /caminho/do/projeto/apps/web/.env.local | grep -v "ACCESS_TOKEN\|API_KEY" | head -20

# 3. Verificar NEXT_PUBLIC_APP_URL especificamente
echo "=== 3. NEXT_PUBLIC_APP_URL ==="
cat /caminho/do/projeto/apps/web/.env.local | grep NEXT_PUBLIC_APP_URL

# 4. Verificar processos PM2
echo "=== 4. Processos PM2 ==="
pm2 list

# 5. Ver variáveis do processo
echo "=== 5. Variáveis do processo ==="
pm2 env 0 | grep -E "NEXT_PUBLIC|MERCADOPAGO|SUPABASE"

# 6. Ver últimos logs
echo "=== 6. Últimos logs ==="
pm2 logs web --lines 20 --nostream
```

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: Arquivo .env.local não existe
```bash
# Solução: Criar o arquivo
cd /caminho/do/projeto/apps/web
nano .env.local
# Cole as variáveis corretas e salve
```

### Problema 2: NEXT_PUBLIC_APP_URL está como localhost
```bash
# Solução: Editar o arquivo
nano /caminho/do/projeto/apps/web/.env.local
# Mudar para: NEXT_PUBLIC_APP_URL=https://agonimports.com
# Salvar e rebuild
npm run build
pm2 restart all
```

### Problema 3: Variáveis não estão sendo lidas
```bash
# Possível causa: PM2 não recarregou as variáveis
# Solução: Restart completo
pm2 delete all
cd /caminho/do/projeto/apps/web
pm2 start npm --name "web" -- start
pm2 save
```

### Problema 4: Permissões incorretas
```bash
# Solução: Ajustar permissões
chmod 600 .env.local
chown seu-usuario:seu-usuario .env.local
```

---

## 📋 Template de .env.local para VPS

Se o arquivo não existir ou estiver errado, use este template:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mroZkoN304nIVzqr1slUyw_vr6azXqF

# Mercado Pago (TEST credentials)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-854979957979936-040618-8c13ee19d91e882016b9585b019b5072-3319595850
MERCADOPAGO_WEBHOOK_SECRET=meu-segredo-webhook-super-secreto-2024

# App URL - PRODUÇÃO
NEXT_PUBLIC_APP_URL=https://agonimports.com

# Resend (Email)
RESEND_API_KEY=re_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB

# Node Environment
NODE_ENV=production
```

---

## 🔍 Script Completo de Diagnóstico

Salve este script no VPS e execute:

```bash
#!/bin/bash
# diagnostico-env.sh

echo "=========================================="
echo "DIAGNÓSTICO DE VARIÁVEIS DE AMBIENTE"
echo "=========================================="
echo ""

PROJECT_PATH="/caminho/do/projeto/apps/web"

echo "1. Verificando arquivos .env..."
ls -la $PROJECT_PATH/.env* 2>/dev/null || echo "Nenhum arquivo .env encontrado"
echo ""

echo "2. Conteúdo do .env.local (sem senhas)..."
if [ -f "$PROJECT_PATH/.env.local" ]; then
    cat $PROJECT_PATH/.env.local | grep -v "TOKEN\|KEY\|SECRET" || echo "Arquivo vazio ou sem variáveis"
else
    echo "Arquivo .env.local NÃO EXISTE!"
fi
echo ""

echo "3. NEXT_PUBLIC_APP_URL atual..."
if [ -f "$PROJECT_PATH/.env.local" ]; then
    grep NEXT_PUBLIC_APP_URL $PROJECT_PATH/.env.local || echo "Variável não encontrada"
else
    echo "Arquivo .env.local não existe"
fi
echo ""

echo "4. Processos PM2..."
pm2 list
echo ""

echo "5. Variáveis do processo (primeiras 10)..."
pm2 env 0 2>/dev/null | head -10 || echo "PM2 não está rodando ou processo não encontrado"
echo ""

echo "=========================================="
echo "FIM DO DIAGNÓSTICO"
echo "=========================================="
```

Execute:
```bash
chmod +x diagnostico-env.sh
./diagnostico-env.sh
```

---

## 💡 Dica Rápida

Se você só quer ver rapidamente o que está configurado:

```bash
# Comando único que mostra tudo
cd /caminho/do/projeto/apps/web && \
echo "=== .env.local ===" && \
cat .env.local 2>/dev/null || echo "Arquivo não existe" && \
echo "" && \
echo "=== PM2 Process ===" && \
pm2 list
```

---

Depois de executar esses comandos, me mande o resultado que eu te ajudo a identificar o problema! 🔍
