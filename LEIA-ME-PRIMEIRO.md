# 🎯 LEIA-ME PRIMEIRO - Correção do Erro 502 no Checkout

## 📌 Situação Atual

Você está enfrentando erro **502 Bad Gateway** no checkout da VPS. A análise confirmou que:

- ✅ **O código está 100% correto** (todas as correções já implementadas)
- ❌ **O problema está nas variáveis de ambiente da VPS**

## 🚀 Solução em 3 Comandos

```bash
# 1. Upload dos arquivos (na sua máquina local)
bash upload-to-vps.sh user@vps-ip /path/to/app

# 2. Configurar (na VPS)
bash configure-env-vps.sh

# 3. Rebuild e testar (na VPS)
bash COMANDOS-RAPIDOS-VPS.sh rebuild
```

**Tempo total: ~10 minutos**

## 📁 Arquivos Criados

### 🎯 Para Começar
- **`INICIO-AQUI.md`** ← **COMECE AQUI** (guia rápido visual)
- **`upload-to-vps.sh`** - Upload automático de todos os arquivos

### 🔧 Scripts de Configuração
- **`configure-env-vps.sh`** - Configuração interativa das variáveis
- **`COMANDOS-RAPIDOS-VPS.sh`** - Comandos úteis (diagnostic, rebuild, logs)

### 🔍 Scripts de Diagnóstico
- **`diagnose-vps-env.js`** - Verifica todas as variáveis de ambiente
- **`test-mercadopago-vps.js`** - Testa integração com Mercado Pago

### 📚 Documentação
- **`README-DIAGNOSTICO-502.md`** - Documentação completa
- **`GUIA-DIAGNOSTICO-VPS.md`** - Guia passo a passo detalhado

## 🎬 Como Usar

### Opção 1: Upload Automático (Recomendado)

```bash
# Na sua máquina local
chmod +x upload-to-vps.sh
bash upload-to-vps.sh user@vps-ip /path/to/app

# O script vai:
# ✓ Verificar todos os arquivos
# ✓ Testar conexão SSH
# ✓ Fazer upload de tudo
# ✓ Configurar permissões
# ✓ Oferecer conectar na VPS
```

### Opção 2: Upload Manual

```bash
# Na sua máquina local
scp diagnose-vps-env.js user@vps-ip:/path/to/app/
scp test-mercadopago-vps.js user@vps-ip:/path/to/app/
scp configure-env-vps.sh user@vps-ip:/path/to/app/
scp COMANDOS-RAPIDOS-VPS.sh user@vps-ip:/path/to/app/
scp *.md user@vps-ip:/path/to/app/

# Conectar na VPS
ssh user@vps-ip
cd /path/to/app
chmod +x *.sh
```

## 🔑 Informações Necessárias

Antes de começar, tenha em mãos:

1. **Credenciais SSH da VPS**
   - Usuário e IP/hostname
   - Chave SSH configurada

2. **URL da Aplicação**
   - Exemplo: `https://agonimports.com`

3. **Token do Mercado Pago**
   - Obter em: https://www.mercadopago.com.br/developers/panel/credentials
   - Deve começar com: `APP_USR-`

4. **Credenciais do Supabase**
   - URL: `https://seu-projeto.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 📊 Fluxo Completo

```
┌─────────────────────────────────────┐
│  Máquina Local                      │
│  ─────────────                      │
│  1. bash upload-to-vps.sh           │
│     user@vps /path/to/app           │
└──────────────┬──────────────────────┘
               │ Upload via SCP
               ▼
┌─────────────────────────────────────┐
│  VPS                                │
│  ───                                │
│  2. bash configure-env-vps.sh       │
│     (Configuração interativa)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. bash COMANDOS-RAPIDOS-VPS.sh    │
│     diagnostic                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. bash COMANDOS-RAPIDOS-VPS.sh    │
│     rebuild                         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Testar no navegador             │
│     https://agonimports.com/cart    │
└──────────────┬──────────────────────┘
               │
               ▼
         ✅ Checkout funcionando!
```

## 🎯 Comandos Úteis

### Na VPS

```bash
# Diagnóstico completo
bash COMANDOS-RAPIDOS-VPS.sh diagnostic

# Testar Mercado Pago
bash COMANDOS-RAPIDOS-VPS.sh test-mp

# Verificar variáveis
bash COMANDOS-RAPIDOS-VPS.sh check-env

# Rebuild e restart
bash COMANDOS-RAPIDOS-VPS.sh rebuild

# Ver logs
bash COMANDOS-RAPIDOS-VPS.sh logs

# Ver logs do Nginx
bash COMANDOS-RAPIDOS-VPS.sh nginx-logs

# Criar .env.local do template
bash COMANDOS-RAPIDOS-VPS.sh fix-env

# Ajuda
bash COMANDOS-RAPIDOS-VPS.sh help
```

## ✅ Checklist de Verificação

Marque cada item após completar:

- [ ] Upload dos arquivos para VPS concluído
- [ ] Variáveis de ambiente configuradas
- [ ] Diagnóstico executado sem erros críticos
- [ ] Teste do Mercado Pago passou
- [ ] Rebuild da aplicação concluído
- [ ] PM2 reiniciado
- [ ] Checkout testado no navegador
- [ ] Sem erro 502

## 🐛 Problemas Comuns

### ❌ "Permission denied" ao fazer upload

```bash
# Verificar permissões do diretório na VPS
ssh user@vps-ip "ls -la /path/to/app"

# Ajustar permissões se necessário
ssh user@vps-ip "sudo chown -R user:user /path/to/app"
```

### ❌ "Connection refused" ao conectar SSH

```bash
# Verificar se SSH está rodando na VPS
ssh -v user@vps-ip

# Verificar porta SSH (padrão: 22)
ssh -p 22 user@vps-ip
```

### ❌ Erro 502 persiste após configuração

```bash
# Na VPS, limpar cache e rebuild completo
cd /path/to/app/apps/web
rm -rf .next
npm run build
cd ../..
pm2 restart all

# Aguardar 10 segundos
sleep 10

# Testar novamente
```

## 📞 Precisa de Ajuda?

Se após seguir todos os passos o erro persistir:

1. **Execute na VPS:**
   ```bash
   bash COMANDOS-RAPIDOS-VPS.sh diagnostic > diagnostic.txt
   bash COMANDOS-RAPIDOS-VPS.sh test-mp > test-mp.txt
   bash COMANDOS-RAPIDOS-VPS.sh logs > logs.txt
   ```

2. **Baixe os arquivos:**
   ```bash
   # Na sua máquina local
   scp user@vps-ip:/path/to/app/diagnostic.txt .
   scp user@vps-ip:/path/to/app/test-mp.txt .
   scp user@vps-ip:/path/to/app/logs.txt .
   ```

3. **Compartilhe os arquivos** para análise

## 🎉 Resultado Esperado

Após a configuração completa:

- ✅ Diagnóstico: "ALL CHECKS PASSED"
- ✅ Teste MP: "All checks passed!"
- ✅ Checkout redireciona para Mercado Pago
- ✅ Pedidos são criados com sucesso
- ✅ Sem erro 502

## 📚 Documentação Adicional

- **`INICIO-AQUI.md`** - Guia rápido visual
- **`README-DIAGNOSTICO-502.md`** - Documentação completa
- **`GUIA-DIAGNOSTICO-VPS.md`** - Troubleshooting detalhado

## ⏱️ Tempo Estimado

- Upload: **1 minuto**
- Configuração: **5 minutos**
- Diagnóstico: **2 minutos**
- Rebuild: **3 minutos**
- **Total: ~11 minutos**

---

## 🚀 Comece Agora!

### Passo 1: Upload (na sua máquina local)

```bash
chmod +x upload-to-vps.sh
bash upload-to-vps.sh user@vps-ip /path/to/app
```

### Passo 2: Configurar (na VPS)

```bash
bash configure-env-vps.sh
```

### Passo 3: Rebuild (na VPS)

```bash
bash COMANDOS-RAPIDOS-VPS.sh rebuild
```

### Passo 4: Testar

Acesse: https://agonimports.com/cart

---

## 💡 Dica Final

Todos os scripts têm mensagens coloridas e são interativos. Siga as instruções na tela e você terá o checkout funcionando em poucos minutos!

**Boa sorte! 🚀**
