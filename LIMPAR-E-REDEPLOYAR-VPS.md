# LIMPEZA COMPLETA E REDEPLOY NA VPS

## 🎯 OBJETIVO
Remover TUDO da VPS e fazer um deploy limpo do zero para garantir que não há configurações antigas conflitantes.

---

## PARTE 1: LIMPEZA COMPLETA DA VPS

### 1. Parar e Remover PM2
```bash
# Parar todos os processos
pm2 stop all

# Deletar todos os processos
pm2 delete all

# Limpar dump do PM2
pm2 save --force

# Matar daemon do PM2
pm2 kill
```

### 2. Remover Aplicação Antiga
```bash
# Fazer backup (por segurança)
sudo mv /var/www/agon /var/www/agon.backup.$(date +%Y%m%d_%H%M%S)

# OU deletar completamente (se tiver certeza)
sudo rm -rf /var/www/agon
```

### 3. Limpar Configuração do Nginx
```bash
# Remover configuração antiga
sudo rm /etc/nginx/sites-enabled/agon
sudo rm /etc/nginx/sites-available/agon

# Testar nginx
sudo nginx -t

# Recarregar nginx
sudo systemctl reload nginx
```

### 4. Limpar Node Modules Globais (opcional)
```bash
# Ver o que está instalado globalmente
npm list -g --depth=0

# Se tiver PM2 global antigo, reinstalar
npm uninstall -g pm2
npm install -g pm2
```

---

## PARTE 2: PREPARAR CÓDIGO LOCALMENTE

### 1. Garantir que o Código Está Atualizado
```bash
# No seu computador, no diretório do projeto
git status
git add .
git commit -m "fix: correções para deploy limpo"
git push origin main
```

### 2. Criar .env.production Correto
Crie o arquivo `apps/web/.env.production` com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5aHBxZWNueGt2dG5qZHFod2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTg4MzksImV4cCI6MjA5MDgzNDgzOX0.VtgGgoi91hlBQmCg5RrdMOECMRdGM0R1Yp_AEoVVI60

# Mercado Pago (PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-6434179465639582-040620-91dcf67827adfca6a253eca0cb9c8c2e-568670523
MERCADOPAGO_WEBHOOK_SECRET=d79153bf3c2655799d8766b671e90488da7cdeaf8750bbc0afd4004e9ef71c87

# App
NEXT_PUBLIC_APP_URL=https://agonimports.com
NODE_ENV=production
PORT=30000

# Resend (opcional)
RESEND_API_KEY=re_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB
```

---

## PARTE 3: DEPLOY LIMPO NA VPS

### 1. Conectar na VPS
```bash
ssh root@srv1554002
```

### 2. Instalar Dependências do Sistema (se necessário)
```bash
# Atualizar sistema
sudo apt update

# Instalar Node.js 20 (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versões
node -v  # deve ser v20.x
npm -v

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx (se não tiver)
sudo apt install -y nginx
```

### 3. Criar Estrutura de Diretórios
```bash
# Criar diretório do projeto
sudo mkdir -p /var/www/agon

# Dar permissões
sudo chown -R $USER:$USER /var/www/agon
```

### 4. Clonar Repositório
```bash
cd /var/www/agon

# Se for repositório privado, configure SSH key antes
# Se for público:
git clone https://github.com/SEU_USUARIO/SEU_REPO.git app

# OU se já tiver o código, fazer upload via SCP/SFTP
```

### 5. Instalar Dependências
```bash
cd /var/www/agon/app

# Instalar dependências
npm install

# Instalar dependências do workspace web
cd apps/web
npm install
```

### 6. Criar .env.local na VPS
```bash
cd /var/www/agon/app/apps/web

# Criar arquivo .env.local
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5aHBxZWNueGt2dG5qZHFod2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTg4MzksImV4cCI6MjA5MDgzNDgzOX0.VtgGgoi91hlBQmCg5RrdMOECMRdGM0R1Yp_AEoVVI60

# Mercado Pago (PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-6434179465639582-040620-91dcf67827adfca6a253eca0cb9c8c2e-568670523
MERCADOPAGO_WEBHOOK_SECRET=d79153bf3c2655799d8766b671e90488da7cdeaf8750bbc0afd4004e9ef71c87

# App
NEXT_PUBLIC_APP_URL=https://agonimports.com
NODE_ENV=production
PORT=30000

# Resend (opcional)
RESEND_API_KEY=re_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB
EOF

# Verificar se foi criado corretamente
cat .env.local
```

### 7. Build da Aplicação
```bash
cd /var/www/agon/app/apps/web

# Fazer build
npm run build

# Verificar se o build foi criado
ls -la .next/
```

### 8. Configurar Nginx
```bash
# Criar configuração do Nginx
sudo nano /etc/nginx/sites-available/agon
```

Cole este conteúdo:

```nginx
server {
    listen 80;
    server_name agonimports.com www.agonimports.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name agonimports.com www.agonimports.com;

    # Certificados SSL (ajuste os caminhos se necessário)
    ssl_certificate /etc/letsencrypt/live/agonimports.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agonimports.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/agon_access.log;
    error_log /var/log/nginx/agon_error.log;

    # Proxy para Next.js
    location / {
        proxy_pass http://localhost:30000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para assets estáticos
    location /_next/static {
        proxy_pass http://localhost:30000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

Salve e saia (Ctrl+X, Y, Enter).

### 9. Ativar Configuração do Nginx
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/agon /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx
```

### 10. Iniciar Aplicação com PM2
```bash
cd /var/www/agon/app/apps/web

# Iniciar com PM2
PORT=30000 pm2 start npm --name "agon-web" -- start

# Salvar configuração
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Copie e execute o comando que aparecer

# Ver status
pm2 status

# Ver logs
pm2 logs agon-web
```

### 11. Verificar se Está Funcionando
```bash
# Verificar porta
netstat -tlnp | grep 30000

# Testar localmente
curl http://localhost:30000

# Ver logs em tempo real
pm2 logs agon-web --lines 50
```

---

## PARTE 4: TESTAR NO NAVEGADOR

1. Abra: `https://agonimports.com`
2. Adicione produto ao carrinho
3. Vá para: `https://agonimports.com/cart`
4. Clique em "Finalizar Compra"
5. Preencha os dados e finalize

---

## 🔍 SE AINDA DER ERRO 502

O problema NÃO é de infraestrutura. É no código da rota `/api/checkout/create-order`.

Execute:
```bash
# Ver logs detalhados
pm2 logs agon-web --lines 100

# Testar a rota diretamente
curl -X POST http://localhost:30000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": "test", "quantity": 1}],
    "customer": {"name": "Teste", "email": "teste@teste.com"}
  }'
```

Me envie o resultado desses comandos.

---

## 📝 CHECKLIST

- [ ] PM2 limpo
- [ ] Diretório antigo removido
- [ ] Nginx limpo
- [ ] Código clonado/enviado
- [ ] Dependências instaladas
- [ ] .env.local criado com PORT=30000
- [ ] Build feito com sucesso
- [ ] Nginx configurado
- [ ] PM2 iniciado na porta 30000
- [ ] Teste no navegador

---

**IMPORTANTE**: Se depois de tudo isso ainda der erro 502, o problema está NO CÓDIGO da rota de checkout, não na infraestrutura.
