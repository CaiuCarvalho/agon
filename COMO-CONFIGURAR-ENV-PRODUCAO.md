# Como Configurar Variáveis de Ambiente no VPS

## 📍 Onde Mudar a Variável NEXT_PUBLIC_APP_URL

A variável `NEXT_PUBLIC_APP_URL` precisa ser configurada **no servidor VPS**, não no código local.

---

## 🎯 Opção 1: Arquivo .env.local no VPS (RECOMENDADO)

### Passo a Passo:

1. **Conecte-se ao seu VPS via SSH:**
   ```bash
   ssh usuario@seu-servidor.com
   ```

2. **Navegue até a pasta do projeto:**
   ```bash
   cd /caminho/do/seu/projeto/apps/web
   ```

3. **Crie ou edite o arquivo .env.local:**
   ```bash
   nano .env.local
   # ou
   vim .env.local
   ```

4. **Adicione/atualize as variáveis:**
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mroZkoN304nIVzqr1slUyw_vr6azXqF

   # Mercado Pago (TEST credentials)
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-854979957979936-040618-8c13ee19d91e882016b9585b019b5072-3319595850
   MERCADOPAGO_WEBHOOK_SECRET=meu-segredo-webhook-super-secreto-2024

   # App URL - MUDE AQUI! ⚠️
   NEXT_PUBLIC_APP_URL=https://agonimports.com

   # Resend (Email)
   RESEND_API_KEY=re_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB

   # Node Environment
   NODE_ENV=production
   ```

5. **Salve o arquivo:**
   - No nano: `Ctrl + X`, depois `Y`, depois `Enter`
   - No vim: `Esc`, depois `:wq`, depois `Enter`

6. **Rebuild e reinicie a aplicação:**
   ```bash
   npm run build
   pm2 restart all
   # ou
   pm2 restart web
   ```

---

## 🎯 Opção 2: Variáveis de Ambiente do PM2

Se você usa PM2 para gerenciar o processo:

1. **Crie um arquivo ecosystem.config.js:**
   ```bash
   cd /caminho/do/seu/projeto
   nano ecosystem.config.js
   ```

2. **Adicione a configuração:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'agon-web',
       script: 'npm',
       args: 'start',
       cwd: './apps/web',
       env: {
         NODE_ENV: 'production',
         NEXT_PUBLIC_SUPABASE_URL: 'https://yyhpqecnxkvtnjdqhwhk.supabase.co',
         NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_mroZkoN304nIVzqr1slUyw_vr6azXqF',
         MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-854979957979936-040618-8c13ee19d91e882016b9585b019b5072-3319595850',
         MERCADOPAGO_WEBHOOK_SECRET: 'meu-segredo-webhook-super-secreto-2024',
         NEXT_PUBLIC_APP_URL: 'https://agonimports.com',  // ⚠️ MUDE AQUI!
         RESEND_API_KEY: 're_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB'
       }
     }]
   };
   ```

3. **Reinicie com o novo config:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   pm2 save
   ```

---

## 🎯 Opção 3: Variáveis de Ambiente do Sistema

Se você usa systemd ou outro gerenciador:

1. **Edite o arquivo de serviço:**
   ```bash
   sudo nano /etc/systemd/system/agon-web.service
   ```

2. **Adicione as variáveis na seção [Service]:**
   ```ini
   [Service]
   Environment="NODE_ENV=production"
   Environment="NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co"
   Environment="NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mroZkoN304nIVzqr1slUyw_vr6azXqF"
   Environment="MERCADOPAGO_ACCESS_TOKEN=APP_USR-854979957979936-040618-8c13ee19d91e882016b9585b019b5072-3319595850"
   Environment="MERCADOPAGO_WEBHOOK_SECRET=meu-segredo-webhook-super-secreto-2024"
   Environment="NEXT_PUBLIC_APP_URL=https://agonimports.com"
   Environment="RESEND_API_KEY=re_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB"
   ```

3. **Recarregue e reinicie:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart agon-web
   ```

---

## 🎯 Opção 4: Docker (se você usa Docker)

1. **Edite o docker-compose.yml:**
   ```yaml
   services:
     web:
       environment:
         - NODE_ENV=production
         - NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co
         - NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mroZkoN304nIVzqr1slUyw_vr6azXqF
         - MERCADOPAGO_ACCESS_TOKEN=APP_USR-854979957979936-040618-8c13ee19d91e882016b9585b019b5072-3319595850
         - MERCADOPAGO_WEBHOOK_SECRET=meu-segredo-webhook-super-secreto-2024
         - NEXT_PUBLIC_APP_URL=https://agonimports.com  # ⚠️ MUDE AQUI!
         - RESEND_API_KEY=re_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB
   ```

2. **Recrie o container:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

---

## ✅ Como Verificar se Funcionou

Depois de configurar, verifique se a variável está correta:

### Método 1: Verificar nos logs
```bash
pm2 logs web | grep APP_URL
```

### Método 2: Testar no navegador
1. Acesse `https://agonimports.com`
2. Adicione um produto ao carrinho
3. Vá para o checkout
4. Ao clicar em "Finalizar Pedido", verifique se a URL de retorno do Mercado Pago está correta

### Método 3: Verificar no código (temporário)
Adicione um console.log temporário em `apps/web/src/app/api/checkout/create-order/route.ts`:

```typescript
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
```

---

## ⚠️ IMPORTANTE

1. **NÃO commite o arquivo .env.local** no Git (ele já está no .gitignore)
2. **Sempre use HTTPS** em produção: `https://agonimports.com`
3. **Rebuild é obrigatório** após mudar variáveis que começam com `NEXT_PUBLIC_`
4. **Reinicie o servidor** após qualquer mudança de variável

---

## 🔍 Troubleshooting

### Se o checkout ainda usar localhost:
1. Verifique se você fez rebuild: `npm run build`
2. Verifique se reiniciou o servidor: `pm2 restart all`
3. Verifique se a variável está correta: `pm2 env 0` (substitua 0 pelo ID do processo)

### Se aparecer erro "NEXT_PUBLIC_APP_URL not configured":
1. A variável não está definida no servidor
2. Siga os passos acima para configurá-la
3. Não esqueça de fazer rebuild e restart

---

## 📝 Resumo Rápido

```bash
# 1. SSH no servidor
ssh usuario@servidor

# 2. Ir para a pasta do projeto
cd /caminho/do/projeto/apps/web

# 3. Editar .env.local
nano .env.local
# Adicionar: NEXT_PUBLIC_APP_URL=https://agonimports.com

# 4. Rebuild
npm run build

# 5. Restart
pm2 restart all

# 6. Verificar logs
pm2 logs web
```

Pronto! Agora o checkout vai usar a URL de produção correta. 🚀
