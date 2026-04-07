# Guia de Deploy - Agon E-commerce

Este guia detalha o processo completo de deploy da aplicação Agon em um VPS.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ (ou similar)
- Node.js 18+ instalado
- Nginx instalado
- PM2 instalado globalmente (`npm install -g pm2`)
- Domínio configurado apontando para o VPS
- Acesso SSH ao servidor

## 🗄️ Parte 1: Configurar Supabase (Banco de Dados)

### 1.1 Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova organização (se necessário)
3. Crie um novo projeto:
   - Nome: `agon-production`
   - Database Password: Gere uma senha forte e salve
   - Region: Escolha a mais próxima do Brasil (ex: South America)

### 1.2 Aplicar Migrations

Você precisa aplicar todas as migrations na ordem correta. Acesse o **SQL Editor** no Supabase e execute:

#### Migration 1: Cart Items
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000001_create_cart_items_table.sql
```

#### Migration 2: Wishlist Items
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000002_create_wishlist_items_table.sql
```

#### Migration 3: Wishlist Limit Trigger
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000003_create_wishlist_limit_trigger.sql
```

#### Migration 4: Cart Migration RPC
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000004_create_cart_migration_rpc.sql
```

#### Migration 5: Wishlist Migration RPC
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000005_create_wishlist_migration_rpc.sql
```

#### Migration 6: Add to Cart Atomic RPC
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000006_create_add_to_cart_atomic_rpc.sql
```

#### Migration 7: Cart Cross-Field Constraints
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000007_add_cart_items_cross_field_constraints.sql
```

#### Migration 8: Rate Limit Log
```sql
-- Cole o conteúdo de: supabase/migrations/20260404000008_create_rate_limit_log_table.sql
```

#### Migration 9: Orders Table
```sql
-- Cole o conteúdo de: supabase/migrations/20260405000001_create_orders_table.sql
```

#### Migration 10: Order Items Table
```sql
-- Cole o conteúdo de: supabase/migrations/20260405000002_create_order_items_table.sql
```

#### Migration 11: Orders RLS Policies
```sql
-- Cole o conteúdo de: supabase/migrations/20260405000003_create_orders_rls_policies.sql
```

#### Migration 12: Order Items RLS Policies
```sql
-- Cole o conteúdo de: supabase/migrations/20260405000004_create_order_items_rls_policies.sql
```

#### Migration 13: Order Atomic RPC
```sql
-- Cole o conteúdo de: supabase/migrations/20260405000005_create_order_atomic_rpc.sql
```

#### Migration 14: Mercado Pago Payments
```sql
-- Cole o conteúdo de: supabase/migrations/20250406_mercadopago_payments.sql
```

### 1.3 Verificar Migrations

Execute esta query para verificar se tudo foi criado:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve retornar:
-- cart_items
-- order_items
-- orders
-- payments
-- products
-- profiles
-- rate_limit_log
-- wishlist_items
```

### 1.4 Copiar Credenciais

No painel do Supabase, vá em **Settings > API** e copie:
- Project URL (ex: `https://xxxxx.supabase.co`)
- `anon` public key (começa com `eyJ...`)

## 💳 Parte 2: Configurar Mercado Pago (Produção)

### 2.1 Obter Credenciais de Produção

1. Acesse: [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)
2. Selecione sua aplicação
3. Vá em **Credenciais de produção**
4. Complete o processo de ativação (se necessário)
5. Copie o **Access Token de produção** (começa com `APP_USR-`)

### 2.2 Gerar Webhook Secret

```bash
# No seu terminal local, gere um secret aleatório:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e guarde para usar nas variáveis de ambiente.

### 2.3 Configurar Webhook (Depois do Deploy)

Você configurará o webhook após o deploy, quando tiver a URL de produção.

## 🚀 Parte 3: Deploy no VPS

### 3.1 Conectar ao VPS

```bash
ssh usuario@seu-servidor.com
```

### 3.2 Preparar Diretório

```bash
# Criar diretório da aplicação
sudo mkdir -p /var/www/agon
sudo chown -R $USER:$USER /var/www/agon
cd /var/www/agon

# Clonar repositório
git clone https://github.com/CaiuCarvalho/agon.git app
cd app
```

### 3.3 Instalar Dependências

```bash
npm install
```

### 3.4 Configurar Variáveis de Ambiente

```bash
# Criar arquivo de environment
nano apps/web/.env.local
```

Cole o seguinte conteúdo (substitua pelos seus valores):

```env
# Supabase (PRODUÇÃO)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mercado Pago (PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao
MERCADOPAGO_WEBHOOK_SECRET=seu-secret-gerado-anteriormente
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Resend (Email - opcional)
RESEND_API_KEY=re_seu_api_key

# Cloudinary (Upload de imagens - opcional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=seu-upload-preset

# Node Environment
NODE_ENV=production
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

### 3.5 Build da Aplicação

```bash
npm run build
```

Aguarde o build completar (pode levar alguns minutos).

### 3.6 Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start npm --name agon-web -- run start --prefix apps/web

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que o PM2 mostrar
```

### 3.7 Verificar Status

```bash
pm2 status
pm2 logs agon-web
```

A aplicação deve estar rodando na porta 3000.

## 🌐 Parte 4: Configurar Nginx

### 4.1 Criar Configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/agon
```

Cole o seguinte conteúdo (substitua `seu-dominio.com`):

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirect to HTTPS (será configurado depois)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
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

    # Aumentar tamanho máximo de upload (para imagens)
    client_max_body_size 10M;
}
```

### 4.2 Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/agon /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 4.3 Testar Acesso

Acesse `http://seu-dominio.com` no navegador. O site deve estar funcionando.

## 🔒 Parte 5: Configurar SSL (HTTPS)

### 5.1 Instalar Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obter Certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Siga as instruções:
- Digite seu email
- Aceite os termos
- Escolha se quer compartilhar email (opcional)
- Escolha opção 2 (redirect HTTP para HTTPS)

### 5.3 Verificar Renovação Automática

```bash
sudo certbot renew --dry-run
```

O Certbot configurará renovação automática via cron.

## 🪝 Parte 6: Configurar Webhook do Mercado Pago

### 6.1 Configurar no Painel

1. Acesse: [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)
2. Selecione sua aplicação
3. Vá em **Webhooks**
4. Clique em **Configurar notificações**
5. Em "URL de produção", adicione:
   ```
   https://seu-dominio.com/api/webhooks/mercadopago
   ```
6. Selecione os eventos:
   - ✅ **Pagamentos** (payment)
7. Em "Secret", cole o mesmo secret que você gerou e colocou no `.env.local`
8. Clique em **Salvar**

### 6.2 Testar Webhook

Faça um pedido de teste no site e verifique os logs:

```bash
pm2 logs agon-web --lines 50
```

Você deve ver mensagens como:
```
Webhook received: payment_id=123456789
Payment status updated: approved
```

## ✅ Parte 7: Verificação Final

### 7.1 Checklist de Testes

Execute estes testes no site em produção:

- [ ] Página inicial carrega corretamente
- [ ] Cadastro de novo usuário funciona
- [ ] Login funciona
- [ ] Adicionar produto ao carrinho funciona
- [ ] Adicionar produto à wishlist funciona
- [ ] Checkout completo funciona
- [ ] Redirecionamento para Mercado Pago funciona
- [ ] Pagamento de teste é processado
- [ ] Webhook atualiza status do pedido
- [ ] Carrinho é limpo após pagamento aprovado
- [ ] Página de confirmação é exibida

### 7.2 Monitoramento

```bash
# Ver logs em tempo real
pm2 logs agon-web

# Ver status
pm2 status

# Ver uso de recursos
pm2 monit
```

## 🔄 Parte 8: Atualizações Futuras

### 8.1 Script de Deploy

Crie um script para facilitar deploys futuros:

```bash
nano /var/www/agon/app/deploy.sh
```

Cole:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Restart PM2
echo "♻️  Restarting application..."
pm2 restart agon-web

echo "✅ Deployment complete!"
echo "📊 Checking status..."
pm2 status
```

Torne executável:

```bash
chmod +x /var/www/agon/app/deploy.sh
```

### 8.2 Fazer Deploy de Atualizações

```bash
cd /var/www/agon/app
./deploy.sh
```

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs detalhados
pm2 logs agon-web --lines 100

# Verificar variáveis de ambiente
cat apps/web/.env.local

# Reiniciar aplicação
pm2 restart agon-web
```

### Erro 502 Bad Gateway

```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar conexão local
curl http://localhost:3000
```

### Webhook não funciona

```bash
# Verificar logs
pm2 logs agon-web | grep webhook

# Testar manualmente
curl -X POST https://seu-dominio.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=abc123" \
  -H "x-request-id: test-123" \
  -d '{"data":{"id":"123"},"type":"payment"}'
```

### Banco de dados não conecta

```bash
# Verificar credenciais do Supabase
cat apps/web/.env.local | grep SUPABASE

# Testar conexão
curl https://seu-projeto.supabase.co/rest/v1/
```

## 📊 Monitoramento em Produção

### Logs Importantes

```bash
# Logs da aplicação
pm2 logs agon-web

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Uso de recursos
pm2 monit
htop
```

### Backup do Banco

O Supabase faz backup automático, mas você pode fazer backups manuais:

1. Acesse o painel do Supabase
2. Vá em **Database > Backups**
3. Clique em **Create backup**

## 🎉 Conclusão

Seu e-commerce está no ar! 

Próximos passos recomendados:
- Configure monitoramento de erros (Sentry)
- Configure analytics (Google Analytics já está integrado)
- Implemente as features sugeridas em `NEXT-FEATURES.md`
- Configure backup automático do código

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `pm2 logs agon-web`
2. Consulte a documentação do projeto
3. Abra uma issue no repositório
