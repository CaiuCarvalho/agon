# Guia de Deploy - Agon

Este documento descreve o processo completo de deploy do Agon em uma VPS com Ubuntu/Debian.

## Pré-requisitos

- Node.js 18+ instalado
- PM2 instalado globalmente (`npm install -g pm2`)
- Nginx instalado
- Acesso root ou sudo na VPS

## 1. Preparar o Ambiente

### 1.1. Clonar o Repositório

```bash
cd /var/www
mkdir -p agon
cd agon
git clone https://github.com/CaiuCarvalho/agon.git app
cd app
```

### 1.2. Instalar Dependências

```bash
npm install
```

### 1.3. Configurar Variáveis de Ambiente

```bash
# Copiar template para apps/web
cp apps/web/.env.production apps/web/.env.local

# Editar com valores reais
nano apps/web/.env.local
```

Ajuste o `NEXT_PUBLIC_API_URL` para o domínio real:

```env
NEXT_PUBLIC_API_URL=https://agonimports.com/api
NODE_ENV=production
```

### 1.4. Build do Projeto

```bash
npm run build
```

## 2. Configurar Nginx

### 2.1. Criar Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/agon
```

Cole o seguinte conteúdo:

```nginx
server {
    listen 80;
    server_name agonimports.com www.agonimports.com;

    # Next.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API (opcional, se necessário)
    location /api {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/agon-access.log;
    error_log /var/log/nginx/agon-error.log;
}
```

### 2.2. Ativar o Site

```bash
sudo ln -s /etc/nginx/sites-available/agon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Subir Aplicação com PM2

### 3.1. Iniciar Next.js

```bash
cd /var/www/agon/app
pm2 start npm --name agon-web -- run start --prefix apps/web
```

### 3.2. Iniciar API (Opcional)

Se precisar da API Fastify:

```bash
pm2 start apps/api/dist/server.js --name agon-api
```

### 3.3. Configurar PM2 para Auto-Start

```bash
pm2 save
pm2 startup
```

Copie e execute o comando que o PM2 retornar.

### 3.4. Verificar Status

```bash
pm2 status
pm2 logs agon-web --lines 50
```

## 4. Configurar SSL (HTTPS)

### 4.1. Instalar Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 4.2. Obter Certificado SSL

```bash
sudo certbot --nginx -d agonimports.com -d www.agonimports.com
```

Siga as instruções do Certbot. Ele vai configurar automaticamente o Nginx para HTTPS.

### 4.3. Renovação Automática

O Certbot configura renovação automática via cron. Teste com:

```bash
sudo certbot renew --dry-run
```

## 5. Monitoramento e Logs

### 5.1. Ver Logs em Tempo Real

```bash
# Next.js
pm2 logs agon-web

# API
pm2 logs agon-api

# Nginx
sudo tail -f /var/log/nginx/agon-access.log
sudo tail -f /var/log/nginx/agon-error.log
```

### 5.2. Reiniciar Aplicação

```bash
pm2 restart agon-web
pm2 restart agon-api
```

### 5.3. Parar Aplicação

```bash
pm2 stop agon-web
pm2 stop agon-api
```

## 6. Atualizações (Deploy Contínuo)

### 6.1. Script de Deploy

Crie um script para facilitar atualizações:

```bash
nano /var/www/agon/deploy.sh
```

Cole o seguinte:

```bash
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
pm2 restart agon-web

echo "✅ Deploy concluído!"
pm2 status
```

Torne executável:

```bash
chmod +x /var/www/agon/deploy.sh
```

### 6.2. Executar Deploy

```bash
/var/www/agon/deploy.sh
```

## 7. Configurações Avançadas (Opcional)

### 7.1. Aumentar Limite de Memória

```bash
pm2 delete agon-web
pm2 start npm --name agon-web --max-memory-restart 1G -- run start --prefix apps/web
pm2 save
```

### 7.2. Configurar Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 7.3. Monitoramento com PM2 Plus (Opcional)

```bash
pm2 link <secret_key> <public_key>
```

Obtenha as chaves em: https://app.pm2.io

## 8. Troubleshooting

### Aplicação não inicia

```bash
# Ver logs detalhados
pm2 logs agon-web --lines 100

# Verificar se a porta 3000 está livre
sudo lsof -i :3000

# Testar manualmente
cd /var/www/agon/app/apps/web
npm run start
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se o Next.js está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/agon-error.log

# Testar conexão local
curl http://localhost:3000
```

### Build falha

```bash
# Limpar cache e rebuildar
rm -rf apps/web/.next
rm -rf node_modules
npm install
npm run build
```

## 9. Segurança

### 9.1. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 9.2. Fail2Ban (Opcional)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 10. Backup

### 10.1. Backup Automático

Crie um cron job para backup diário:

```bash
crontab -e
```

Adicione:

```cron
0 2 * * * tar -czf /backup/agon-$(date +\%Y\%m\%d).tar.gz /var/www/agon/app
```

## Suporte

Para problemas ou dúvidas, consulte:
- Documentação do Next.js: https://nextjs.org/docs
- Documentação do PM2: https://pm2.keymetrics.io/docs
- Issues do projeto: https://github.com/CaiuCarvalho/agon/issues
