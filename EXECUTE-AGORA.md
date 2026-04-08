# 🚀 EXECUTE AGORA - Passo a Passo Simples

## 📍 Você está aqui
Você está na sua **máquina local** (Windows), na pasta do projeto.

## 🎯 O que você precisa
1. Acesso SSH à VPS (usuário e IP)
2. Caminho onde o projeto está na VPS
3. Token do Mercado Pago
4. Credenciais do Supabase

---

## ⚡ OPÇÃO 1: Método Rápido (Recomendado)

### Passo 1: Conectar na VPS via SSH

Abra o **PowerShell** ou **Git Bash** e conecte na VPS:

```bash
ssh root@157.230.228.94
# OU
ssh ubuntu@157.230.228.94
# OU o usuário que você usa
```

### Passo 2: Navegar até o projeto

```bash
cd /root/agon-mvp
# OU o caminho onde seu projeto está
# Exemplos comuns:
# cd /var/www/agon-mvp
# cd /home/ubuntu/agon-mvp
```

### Passo 3: Verificar se .env.local existe

```bash
ls -la apps/web/.env.local
```

**Se o arquivo NÃO existir:**
```bash
cp apps/web/.env.production apps/web/.env.local
```

### Passo 4: Editar .env.local

```bash
nano apps/web/.env.local
```

**Configure estas variáveis (OBRIGATÓRIO):**

```bash
# Substitua pelos valores reais:
NEXT_PUBLIC_APP_URL=https://agonimports.com

MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui

NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NODE_ENV=production
```

**Para salvar no nano:**
- Pressione `Ctrl + X`
- Pressione `Y`
- Pressione `Enter`

### Passo 5: Rebuild e Restart

```bash
# Rebuild do Next.js
cd apps/web
npm run build

# Voltar para raiz
cd ../..

# Restart do PM2
pm2 restart all

# Ver status
pm2 status
```

### Passo 6: Testar

Aguarde 10 segundos e acesse no navegador:
```
https://agonimports.com/cart
```

Adicione produtos e finalize o pedido. Deve redirecionar para o Mercado Pago!

---

## 🔍 OPÇÃO 2: Com Diagnóstico (Se a Opção 1 não funcionar)

### Passo 1: Fazer upload dos scripts de diagnóstico

**Na sua máquina local (PowerShell ou Git Bash):**

```bash
# Substitua pelos seus valores:
scp diagnose-vps-env.js root@157.230.228.94:/root/agon-mvp/
scp test-mercadopago-vps.js root@157.230.228.94:/root/agon-mvp/
scp configure-env-vps.sh root@157.230.228.94:/root/agon-mvp/
scp COMANDOS-RAPIDOS-VPS.sh root@157.230.228.94:/root/agon-mvp/
```

**Ou se preferir, copie arquivo por arquivo:**

```bash
scp diagnose-vps-env.js root@157.230.228.94:/root/agon-mvp/
```

### Passo 2: Conectar na VPS

```bash
ssh root@157.230.228.94
cd /root/agon-mvp
```

### Passo 3: Tornar scripts executáveis

```bash
chmod +x configure-env-vps.sh
chmod +x COMANDOS-RAPIDOS-VPS.sh
```

### Passo 4: Configurar variáveis (interativo)

```bash
bash configure-env-vps.sh
```

O script vai perguntar cada variável. Responda com os valores corretos.

### Passo 5: Executar diagnóstico

```bash
bash COMANDOS-RAPIDOS-VPS.sh diagnostic
```

Deve mostrar: `✓ ALL CHECKS PASSED`

### Passo 6: Rebuild

```bash
bash COMANDOS-RAPIDOS-VPS.sh rebuild
```

### Passo 7: Testar

Acesse: https://agonimports.com/cart

---

## 🔑 Onde Obter as Informações

### Token do Mercado Pago
1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Clique em "Credenciais de produção"
3. Copie o "Access Token" (começa com APP_USR-)

### Credenciais do Supabase
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY)

---

## ❓ Perguntas Frequentes

### Como saber o usuário SSH?
```bash
# Tente:
ssh root@157.230.228.94
# Ou:
ssh ubuntu@157.230.228.94
```

### Como saber o caminho do projeto?
```bash
# Depois de conectar na VPS:
pm2 list
# Vai mostrar o caminho do projeto
```

### Onde está o arquivo upload-to-vps.sh?
Está na raiz do seu projeto (mesma pasta onde você está agora).

Para usar:
```bash
bash upload-to-vps.sh root@157.230.228.94 /root/agon-mvp
```

### Como ver os logs se der erro?
```bash
# Na VPS:
pm2 logs

# Ou logs do Nginx:
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Checklist Rápido

- [ ] Conectei na VPS via SSH
- [ ] Naveguei até o diretório do projeto
- [ ] Editei apps/web/.env.local com as variáveis corretas
- [ ] Executei npm run build em apps/web
- [ ] Executei pm2 restart all
- [ ] Aguardei 10 segundos
- [ ] Testei o checkout no navegador
- [ ] Funcionou! 🎉

---

## 🆘 Se Nada Funcionar

Execute na VPS e me envie o resultado:

```bash
# Ver variáveis de ambiente
cd apps/web
cat .env.local

# Ver logs do PM2
pm2 logs --lines 50

# Ver status do PM2
pm2 status

# Testar se Next.js está rodando
curl http://localhost:3000
```

---

## 📞 Comandos Úteis

```bash
# Ver processos PM2
pm2 list

# Restart específico
pm2 restart web

# Ver logs em tempo real
pm2 logs

# Parar todos os processos
pm2 stop all

# Iniciar todos os processos
pm2 start all

# Ver informações do sistema
pm2 monit
```

---

**Comece pela OPÇÃO 1 - é mais rápido e direto! 🚀**
