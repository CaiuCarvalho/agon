# Quick Deploy Guide - Agon E-commerce

Guia rápido para deploy. Para detalhes completos, veja `DEPLOY-GUIDE.md`.

## ⚡ Deploy Rápido (30 minutos)

### 1. Supabase (5 min)

```bash
# 1. Criar projeto em https://supabase.com
# 2. Copiar URL e anon key
# 3. No SQL Editor, executar todas as migrations em ordem:
#    - supabase/migrations/*.sql (14 arquivos)
```

### 2. Mercado Pago (5 min)

```bash
# 1. Acessar https://www.mercadopago.com.br/developers/panel/app
# 2. Ir em "Credenciais de produção"
# 3. Copiar Access Token
# 4. Gerar webhook secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. VPS - Código (10 min)

```bash
# Conectar ao VPS
ssh usuario@seu-servidor.com

# Preparar diretório
sudo mkdir -p /var/www/agon
sudo chown -R $USER:$USER /var/www/agon
cd /var/www/agon

# Clonar e instalar
git clone https://github.com/CaiuCarvalho/agon.git app
cd app
npm install

# Configurar environment
nano apps/web/.env.local
```

Cole no `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=seu-secret-gerado
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
NODE_ENV=production
```

```bash
# Build e iniciar
npm run build
pm2 start npm --name agon-web -- run start --prefix apps/web
pm2 save
pm2 startup  # Execute o comando que aparecer
```

### 4. Nginx + SSL (10 min)

```bash
# Criar config
sudo nano /etc/nginx/sites-available/agon
```

Cole:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

```bash
# Ativar e testar
sudo ln -s /etc/nginx/sites-available/agon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 5. Webhook Mercado Pago (2 min)

```bash
# 1. Acessar https://www.mercadopago.com.br/developers/panel/app
# 2. Ir em "Webhooks"
# 3. Adicionar URL: https://seu-dominio.com/api/webhooks/mercadopago
# 4. Selecionar evento: Pagamentos
# 5. Adicionar o mesmo secret do .env.local
# 6. Salvar
```

## ✅ Testar

```bash
# 1. Acessar https://seu-dominio.com
# 2. Criar conta
# 3. Adicionar produto ao carrinho
# 4. Fazer checkout
# 5. Pagar com cartão de teste:
#    - Número: 5031 4332 1540 6351
#    - CVV: 123
#    - Validade: qualquer data futura
#    - Nome: APRO
# 6. Verificar se pedido foi criado e carrinho limpo
```

## 🔍 Verificar Logs

```bash
pm2 logs agon-web
```

## 🚨 Problemas?

```bash
# Reiniciar aplicação
pm2 restart agon-web

# Ver status
pm2 status

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

## 📚 Documentação Completa

- `DEPLOY-GUIDE.md` - Guia detalhado passo a passo
- `DEPLOYMENT-CHECKLIST.md` - Checklist completo
- `MERCADOPAGO-SETUP-GUIDE.md` - Setup detalhado do Mercado Pago
- `NEXT-FEATURES.md` - Próximas features recomendadas

## 🎉 Pronto!

Seu e-commerce está no ar em `https://seu-dominio.com`
