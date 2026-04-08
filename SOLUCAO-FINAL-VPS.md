# 🎯 SOLUÇÃO FINAL - Erro 502 Checkout

## 📍 Informações da sua VPS

- **Projeto**: `/var/www/agon/app`
- **Porta Next.js**: `30000` (não 3000!)
- **PM2**: Rodando OK
- **Nginx**: Rodando OK
- **Problema**: Falta `.env.local` e build

---

## ✅ SOLUÇÃO (Copie e cole estes comandos)

```bash
# 1. Ir para o diretório do projeto
cd /var/www/agon/app

# 2. Verificar estrutura
ls -la apps/web/

# 3. Criar .env.local a partir do template
cp apps/web/.env.production apps/web/.env.local

# 4. Editar .env.local
nano apps/web/.env.local
```

### 📝 Configure estas variáveis no nano:

```bash
NEXT_PUBLIC_APP_URL=https://agonimports.com
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

**Salvar**: `Ctrl+X`, `Y`, `Enter`

```bash
# 5. Fazer build do Next.js
cd apps/web
npm run build

# 6. Voltar para raiz
cd /var/www/agon/app

# 7. Restart do PM2
pm2 restart agon-web

# 8. Ver logs
pm2 logs agon-web --lines 50

# 9. Verificar se está rodando
curl http://localhost:30000
```

---

## 🔧 Verificar Nginx

O Nginx está apontando para a porta correta? Vamos verificar:

```bash
# Ver configuração do Nginx
cat /etc/nginx/sites-available/agon

# Se não existir, tentar:
cat /etc/nginx/sites-enabled/agon
cat /etc/nginx/conf.d/agon.conf
```

**A configuração deve ter:**
```nginx
location / {
    proxy_pass http://localhost:30000;  # PORTA 30000!
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**Se a porta estiver errada (3000 ao invés de 30000):**

```bash
# Editar configuração
nano /etc/nginx/sites-available/agon

# Mudar proxy_pass para:
proxy_pass http://localhost:30000;

# Salvar e testar
nginx -t

# Reload
systemctl reload nginx
```

---

## 🎯 Comandos Completos (Copiar e Colar)

```bash
cd /var/www/agon/app
cp apps/web/.env.production apps/web/.env.local
nano apps/web/.env.local
# (Configure as variáveis)
cd apps/web
npm run build
cd /var/www/agon/app
pm2 restart agon-web
pm2 logs agon-web --lines 20
```

---

## 🔍 Verificar se funcionou

```bash
# 1. Ver logs do PM2
pm2 logs agon-web --lines 50

# 2. Testar localhost
curl http://localhost:30000

# 3. Testar API de checkout
curl -X POST http://localhost:30000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 4. Ver logs do Nginx
tail -50 /var/log/nginx/error.log
```

---

## ⚠️ IMPORTANTE: Onde obter as credenciais

### Token Mercado Pago
1. https://www.mercadopago.com.br/developers/panel/credentials
2. Clique em "Credenciais de produção"
3. Copie o "Access Token" (começa com APP_USR-)

### Supabase
1. https://app.supabase.com
2. Selecione seu projeto
3. Settings → API
4. Copie:
   - Project URL
   - anon public key

---

## 📊 Checklist

- [ ] Criou .env.local em `/var/www/agon/app/apps/web/`
- [ ] Configurou todas as variáveis obrigatórias
- [ ] Executou `npm run build` em `apps/web`
- [ ] Restart do PM2 (`pm2 restart agon-web`)
- [ ] Verificou que Next.js está na porta 30000
- [ ] Verificou que Nginx aponta para porta 30000
- [ ] Testou no navegador: https://agonimports.com/cart

---

## 🆘 Se ainda der erro

Execute e me envie:

```bash
# Ver variáveis configuradas
cat /var/www/agon/app/apps/web/.env.local | grep -E "^[A-Z_]+" | cut -d= -f1

# Ver logs completos
pm2 logs agon-web --lines 100 > logs-pm2.txt
tail -100 /var/log/nginx/error.log > logs-nginx.txt

# Ver se build existe
ls -la /var/www/agon/app/apps/web/.next/

# Testar API
curl -v http://localhost:30000/api/checkout/create-order
```

---

**Execute os comandos e me avise se funcionou! 🚀**
