# 🔍 DIAGNÓSTICO COMPLETO DA VPS

## 📋 O que você precisa fazer

Execute estes comandos na VPS e me envie o resultado completo.

---

## 🚀 Passo a Passo

### 1. Conectar na VPS

```bash
ssh root@157.230.228.94
# OU
ssh ubuntu@157.230.228.94
```

### 2. Fazer upload do script de diagnóstico

**Opção A: Copiar e colar o conteúdo**

```bash
# Criar o arquivo
nano diagnostico-completo-vps.sh

# Cole o conteúdo do arquivo diagnostico-completo-vps.sh
# Salve: Ctrl+X, Y, Enter
```

**Opção B: Upload via SCP (na sua máquina local)**

```bash
scp diagnostico-completo-vps.sh root@157.230.228.94:/root/
```

### 3. Executar o diagnóstico

```bash
# Tornar executável
chmod +x diagnostico-completo-vps.sh

# Executar e salvar resultado
bash diagnostico-completo-vps.sh > diagnostico-resultado.txt 2>&1

# Ver o resultado
cat diagnostico-resultado.txt
```

### 4. Me enviar o resultado

**Opção A: Copiar e colar**
```bash
cat diagnostico-resultado.txt
# Copie TUDO e me envie
```

**Opção B: Download via SCP (na sua máquina local)**
```bash
scp root@157.230.228.94:/root/diagnostico-resultado.txt .
# Abra o arquivo e me envie
```

---

## 🎯 Comandos Alternativos (se o script não funcionar)

Execute estes comandos um por um e me envie os resultados:

### 1. Informações básicas
```bash
whoami
pwd
hostname
```

### 2. Processos PM2
```bash
pm2 list
pm2 jlist
```

### 3. Encontrar o projeto
```bash
ls -la /root/
ls -la /var/www/
ls -la /home/
```

### 4. Estrutura do projeto (substitua pelo caminho correto)
```bash
cd /root/agon-mvp  # ou o caminho onde está o projeto
ls -la
ls -la apps/
ls -la apps/web/
```

### 5. Verificar arquivos .env
```bash
find /root -name ".env*" -type f 2>/dev/null
# OU
find /var/www -name ".env*" -type f 2>/dev/null
```

### 6. Verificar .env.local específico
```bash
ls -la apps/web/.env.local
cat apps/web/.env.local | grep -E "^[A-Z_]+" | cut -d= -f1
```

### 7. Verificar build
```bash
ls -la apps/web/.next/
cat apps/web/.next/BUILD_ID
```

### 8. Nginx
```bash
systemctl status nginx
cat /etc/nginx/sites-enabled/agonimports
```

### 9. Logs
```bash
pm2 logs --lines 50
tail -50 /var/log/nginx/error.log
```

### 10. Teste de conectividade
```bash
curl -I http://localhost:3000
curl -I https://api.mercadopago.com
```

---

## 📊 O que eu preciso saber

Com essas informações, vou conseguir identificar:

1. ✅ Onde o projeto está localizado exatamente
2. ✅ Se o .env.local existe e onde está
3. ✅ Quais variáveis estão configuradas
4. ✅ Se o build do Next.js está correto
5. ✅ Como o PM2 está configurado
6. ✅ Como o Nginx está configurado
7. ✅ Qual é o erro exato nos logs

---

## 🆘 Se tiver dificuldade

Me envie pelo menos estas informações:

```bash
# 1. Onde você está
pwd

# 2. Processos PM2
pm2 list

# 3. Conteúdo do diretório atual
ls -la

# 4. Procurar .env.local
find . -name ".env.local" 2>/dev/null

# 5. Últimos logs
pm2 logs --lines 20
```

---

**Assim que você me enviar o resultado, vou conseguir te dar a solução exata! 🎯**
