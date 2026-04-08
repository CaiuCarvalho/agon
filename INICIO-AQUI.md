# 🚀 COMECE AQUI - Correção do Erro 502 no Checkout

## ⚡ Solução Rápida (5 minutos)

### 1️⃣ Upload dos arquivos para VPS

```bash
# Na sua máquina local, execute:
scp diagnose-vps-env.js user@vps-ip:/path/to/app/
scp test-mercadopago-vps.js user@vps-ip:/path/to/app/
scp configure-env-vps.sh user@vps-ip:/path/to/app/
scp COMANDOS-RAPIDOS-VPS.sh user@vps-ip:/path/to/app/
```

### 2️⃣ Conectar na VPS e configurar

```bash
# Conectar na VPS
ssh user@vps-ip

# Navegar até o projeto
cd /path/to/app

# Tornar scripts executáveis
chmod +x configure-env-vps.sh COMANDOS-RAPIDOS-VPS.sh

# Configurar variáveis de ambiente (interativo)
bash configure-env-vps.sh
```

### 3️⃣ Rebuild e testar

```bash
# Rebuild e restart
bash COMANDOS-RAPIDOS-VPS.sh rebuild

# Aguardar 10 segundos
sleep 10

# Testar no navegador
# Acesse: https://agonimports.com/cart
# Adicione produtos e finalize o pedido
```

## ✅ Verificação Rápida

Execute estes comandos para verificar se está tudo OK:

```bash
# 1. Diagnóstico completo
bash COMANDOS-RAPIDOS-VPS.sh diagnostic

# 2. Testar Mercado Pago
bash COMANDOS-RAPIDOS-VPS.sh test-mp

# 3. Ver logs
bash COMANDOS-RAPIDOS-VPS.sh logs
```

## 📋 O que cada arquivo faz?

| Arquivo | Descrição | Quando usar |
|---------|-----------|-------------|
| `configure-env-vps.sh` | 🎯 **COMECE AQUI** - Configuração interativa | Primeira vez ou reconfigurar |
| `COMANDOS-RAPIDOS-VPS.sh` | Comandos úteis (diagnostic, rebuild, logs) | Diagnóstico e manutenção |
| `diagnose-vps-env.js` | Verifica todas as variáveis de ambiente | Diagnóstico detalhado |
| `test-mercadopago-vps.js` | Testa conexão com Mercado Pago | Verificar integração |
| `GUIA-DIAGNOSTICO-VPS.md` | Guia completo passo a passo | Troubleshooting detalhado |
| `README-DIAGNOSTICO-502.md` | Documentação completa | Referência |

## 🎯 Fluxo Recomendado

```
┌─────────────────────────────────────┐
│  1. Upload dos arquivos para VPS   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
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
│  5. Testar checkout no navegador    │
└──────────────┬──────────────────────┘
               │
               ▼
         ✅ Sucesso!
```

## 🔑 Variáveis Necessárias

Você precisará ter em mãos:

1. **URL da aplicação**
   - Exemplo: `https://agonimports.com`

2. **Token do Mercado Pago**
   - Obter em: https://www.mercadopago.com.br/developers/panel/credentials
   - Formato: `APP_USR-XXXXXXXXXXXX-XXXXXX-...`

3. **URL do Supabase**
   - Exemplo: `https://seu-projeto.supabase.co`

4. **Chave Anônima do Supabase**
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🐛 Problemas Comuns

### ❌ Erro: "NEXT_PUBLIC_APP_URL not configured"

```bash
# Solução rápida:
echo "NEXT_PUBLIC_APP_URL=https://agonimports.com" >> apps/web/.env.local
pm2 restart all
```

### ❌ Erro: "Invalid MERCADOPAGO_ACCESS_TOKEN format"

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Copie o token de **produção** (começa com `APP_USR-`)
3. Cole no `.env.local`
4. Execute: `pm2 restart all`

### ❌ Erro 502 persiste

```bash
# Limpar cache e rebuild completo
cd apps/web
rm -rf .next
npm run build
cd ../..
pm2 restart all
```

## 📞 Precisa de Ajuda?

Se após seguir os passos o erro persistir:

1. Execute e salve os logs:
   ```bash
   bash COMANDOS-RAPIDOS-VPS.sh diagnostic > diagnostic.txt
   bash COMANDOS-RAPIDOS-VPS.sh test-mp > test-mp.txt
   bash COMANDOS-RAPIDOS-VPS.sh logs > logs.txt
   ```

2. Compartilhe os arquivos gerados

## 🎉 Resultado Esperado

Após a configuração:

- ✅ Diagnóstico mostra: "ALL CHECKS PASSED"
- ✅ Teste do Mercado Pago: "All checks passed!"
- ✅ Checkout redireciona para Mercado Pago
- ✅ Sem erro 502

## 📚 Documentação Adicional

- `README-DIAGNOSTICO-502.md` - Documentação completa
- `GUIA-DIAGNOSTICO-VPS.md` - Guia passo a passo detalhado

## ⏱️ Tempo Estimado

- Configuração inicial: **5 minutos**
- Diagnóstico: **2 minutos**
- Rebuild: **3 minutos**
- **Total: ~10 minutos**

---

## 🚀 Comece Agora!

```bash
# 1. Upload dos arquivos
scp *.js *.sh user@vps-ip:/path/to/app/

# 2. Conectar e configurar
ssh user@vps-ip
cd /path/to/app
bash configure-env-vps.sh

# 3. Pronto! 🎉
```
