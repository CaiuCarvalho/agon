# CORREÇÃO URGENTE - Variáveis de Ambiente VPS

## 🚨 Problema Identificado

O arquivo `.env.local` existe mas as variáveis estão **undefined**. Isso significa que:
1. O arquivo pode estar vazio ou mal formatado
2. O PM2 não está rodando (processos "web" e "agon" não existem)

---

## ✅ SOLUÇÃO PASSO A PASSO

Execute estes comandos **exatamente nesta ordem** no VPS:

### 1. Ver o conteúdo atual do .env.local

```bash
cd /var/www/agon/app/apps/web
cat .env.local
```

**Me envie o resultado deste comando!**

---

### 2. Corrigir o arquivo .env.local

```bash
# Fazer backup do arquivo atual
cp .env.local .env.local.old

# Editar o arquivo
nano .env.local
```

**Cole EXATAMENTE este conteúdo** (apague tudo que estiver lá e cole isso):

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

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

---

### 3. Verificar se salvou corretamente

```bash
cat .env.local | grep NEXT_PUBLIC_APP_URL
# Deve mostrar: NEXT_PUBLIC_APP_URL=https://agonimports.com
```

---

### 4. Descobrir como o servidor está rodando

```bash
# Ver todos os processos PM2
pm2 list

# Se não mostrar nada, ver processos Node rodando
ps aux | grep node

# Ver se tem algum processo na porta 3000
lsof -i :3000

# Ver se tem Nginx rodando
systemctl status nginx
```

**Me envie o resultado destes comandos!**

---

### 5. Rebuild da aplicação (OBRIGATÓRIO)

```bash
cd /var/www/agon/app/apps/web

# Rebuild (isso vai compilar as variáveis NEXT_PUBLIC_*)
npm run build
```

---

### 6. Reiniciar o servidor

**Opção A: Se usar PM2**
```bash
# Ver processos
pm2 list

# Deletar todos
pm2 delete all

# Iniciar novamente
cd /var/www/agon/app/apps/web
pm2 start npm --name "agon-web" -- start

# Salvar configuração
pm2 save

# Ver logs
pm2 logs agon-web
```

**Opção B: Se usar systemd**
```bash
sudo systemctl restart agon-web
sudo systemctl status agon-web
```

**Opção C: Se usar Docker**
```bash
docker-compose down
docker-compose up -d --build
```

**Opção D: Se rodar manualmente**
```bash
# Parar processo atual (Ctrl+C no terminal onde está rodando)
# Ou matar processo
pkill -f "node.*next"

# Iniciar novamente
cd /var/www/agon/app/apps/web
npm start
```

---

### 7. Testar se as variáveis foram carregadas

```bash
cd /var/www/agon/app/apps/web

# Testar com dotenv (carrega .env.local explicitamente)
node -r dotenv/config test-env.js dotenv_config_path=.env.local
```

---

## 🔍 Comandos de Diagnóstico Completo

Execute este bloco inteiro e me envie o resultado:

```bash
echo "=== 1. Conteúdo do .env.local ==="
cat /var/www/agon/app/apps/web/.env.local
echo ""

echo "=== 2. Processos PM2 ==="
pm2 list
echo ""

echo "=== 3. Processos Node rodando ==="
ps aux | grep node | grep -v grep
echo ""

echo "=== 4. Porta 3000 ==="
lsof -i :3000 2>/dev/null || echo "Nada rodando na porta 3000"
echo ""

echo "=== 5. Status Nginx ==="
systemctl status nginx --no-pager -l
echo ""

echo "=== 6. Teste de variáveis ==="
cd /var/www/agon/app/apps/web && node -r dotenv/config test-env.js dotenv_config_path=.env.local
```

---

## 🎯 Solução Rápida (Se tiver pressa)

```bash
# 1. Ir para a pasta
cd /var/www/agon/app/apps/web

# 2. Editar .env.local
nano .env.local
# Cole o conteúdo correto (veja seção 2 acima)
# Salve: Ctrl+X, Y, Enter

# 3. Rebuild
npm run build

# 4. Reiniciar (escolha um)
pm2 restart all
# OU
sudo systemctl restart agon-web
# OU
docker-compose restart

# 5. Verificar
pm2 logs
# OU
sudo journalctl -u agon-web -f
```

---

## ⚠️ IMPORTANTE

**Variáveis que começam com `NEXT_PUBLIC_`** são compiladas no build. Por isso:
1. Sempre que mudar `NEXT_PUBLIC_APP_URL`, você PRECISA fazer `npm run build`
2. Apenas reiniciar o servidor NÃO é suficiente
3. O rebuild pode demorar alguns minutos

**Variáveis sem `NEXT_PUBLIC_`** (como `MERCADOPAGO_ACCESS_TOKEN`) são lidas em runtime, então basta reiniciar.

---

## 📋 Checklist

- [ ] Ver conteúdo atual do .env.local
- [ ] Corrigir .env.local com as variáveis corretas
- [ ] Fazer rebuild: `npm run build`
- [ ] Reiniciar servidor (PM2/systemd/Docker)
- [ ] Testar variáveis com test-env.js
- [ ] Acessar site e testar checkout

---

**Execute os comandos de diagnóstico e me envie o resultado que eu te ajudo a continuar!** 🚀
