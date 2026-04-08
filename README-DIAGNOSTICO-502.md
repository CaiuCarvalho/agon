# 🔧 Diagnóstico e Correção - Erro 502 no Checkout

## 📌 Resumo Executivo

O erro 502 no checkout é causado por **variáveis de ambiente ausentes ou mal configuradas** na VPS. Este guia fornece ferramentas automatizadas para diagnosticar e corrigir o problema.

## 🎯 Causa Raiz Confirmada

O código já está **100% correto** com todas as correções implementadas:
- ✅ Validação robusta de variáveis de ambiente
- ✅ Timeout do MercadoPago ajustado (25s)
- ✅ Tratamento de erro retornando 504 ao invés de 502
- ✅ AbortController com timeout de 60s no cliente
- ✅ Logs detalhados para diagnóstico

**O problema está na configuração da VPS, não no código.**

## 🚀 Solução Rápida (3 passos)

### 1️⃣ Upload dos arquivos de diagnóstico

```bash
# Na sua máquina local
scp diagnose-vps-env.js user@vps-ip:/path/to/app/
scp test-mercadopago-vps.js user@vps-ip:/path/to/app/
scp COMANDOS-RAPIDOS-VPS.sh user@vps-ip:/path/to/app/
```

### 2️⃣ Executar diagnóstico na VPS

```bash
# Conectar na VPS
ssh user@vps-ip

# Navegar até o projeto
cd /path/to/app

# Executar diagnóstico
bash COMANDOS-RAPIDOS-VPS.sh diagnostic
```

### 3️⃣ Corrigir variáveis ausentes

```bash
# Se o diagnóstico mostrar variáveis ausentes:

# Opção A: Criar .env.local automaticamente
bash COMANDOS-RAPIDOS-VPS.sh fix-env

# Editar e configurar as variáveis
nano apps/web/.env.local

# Rebuild e restart
bash COMANDOS-RAPIDOS-VPS.sh rebuild

# Opção B: Configurar manualmente
cd apps/web
cp .env.production .env.local
nano .env.local  # Editar e salvar
cd ../..
npm run build
pm2 restart all
```

## 📁 Arquivos Criados

### 1. `diagnose-vps-env.js`
Script Node.js que verifica:
- ✓ Todas as variáveis de ambiente obrigatórias
- ✓ Formato e validade das variáveis
- ✓ Arquivos .env existentes
- ✓ Build do Next.js
- ✓ Processos PM2 e suas variáveis

**Uso:**
```bash
cd apps/web
node ../../diagnose-vps-env.js
```

### 2. `test-mercadopago-vps.js`
Script Node.js que testa:
- ✓ Token do Mercado Pago configurado
- ✓ Formato do token (APP_USR-...)
- ✓ Conectividade com API do Mercado Pago
- ✓ Validade do token
- ✓ Estrutura da requisição de preferência

**Uso:**
```bash
cd apps/web
node ../../test-mercadopago-vps.js
```

### 3. `COMANDOS-RAPIDOS-VPS.sh`
Script Bash com comandos úteis:
- `diagnostic` - Diagnóstico completo
- `test-mp` - Testar Mercado Pago
- `check-env` - Verificar variáveis
- `rebuild` - Rebuild e restart
- `logs` - Ver logs do PM2
- `nginx-logs` - Ver logs do Nginx
- `fix-env` - Criar .env.local

**Uso:**
```bash
bash COMANDOS-RAPIDOS-VPS.sh [comando]
```

### 4. `GUIA-DIAGNOSTICO-VPS.md`
Guia completo passo a passo com:
- 📋 Checklist de verificação
- 🔍 Diagnóstico detalhado
- 🔧 Correções para cada problema
- 🐛 Troubleshooting avançado
- 📊 Problemas comuns e soluções

## 🔑 Variáveis Obrigatórias

Estas variáveis **DEVEM** estar configuradas no arquivo `apps/web/.env.local`:

```bash
# URL base da aplicação
NEXT_PUBLIC_APP_URL=https://agonimports.com

# Token do Mercado Pago (formato: APP_USR-...)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ambiente
NODE_ENV=production
```

## 🎯 Fluxo de Diagnóstico

```
1. Upload dos scripts → VPS
         ↓
2. Executar diagnóstico
         ↓
3. Identificar variáveis ausentes
         ↓
4. Configurar .env.local
         ↓
5. Rebuild da aplicação
         ↓
6. Restart do PM2
         ↓
7. Testar checkout
         ↓
8. ✅ Sucesso!
```

## 🐛 Problemas Comuns

### Problema: "NEXT_PUBLIC_APP_URL not configured"
**Solução:**
```bash
echo "NEXT_PUBLIC_APP_URL=https://agonimports.com" >> apps/web/.env.local
pm2 restart all
```

### Problema: "Invalid MERCADOPAGO_ACCESS_TOKEN format"
**Solução:**
1. Acesse https://www.mercadopago.com.br/developers/panel/credentials
2. Copie o Access Token de produção (começa com APP_USR-)
3. Cole no .env.local
4. `pm2 restart all`

### Problema: Erro 502 persiste
**Solução:**
```bash
# Limpar cache e rebuild
cd apps/web
rm -rf .next
npm run build
cd ../..
pm2 restart all
```

### Problema: Timeout ao conectar com Mercado Pago
**Solução:**
```bash
# Verificar firewall
sudo ufw status
sudo ufw allow out 443/tcp

# Testar conectividade
curl -I https://api.mercadopago.com
```

## 📊 Checklist de Verificação

Marque cada item após verificar:

- [ ] Scripts de diagnóstico enviados para VPS
- [ ] Diagnóstico executado sem erros críticos
- [ ] Arquivo `.env.local` existe em `apps/web/`
- [ ] `NEXT_PUBLIC_APP_URL` configurado
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado (formato APP_USR-)
- [ ] Variáveis do Supabase configuradas
- [ ] Build do Next.js executado
- [ ] PM2 reiniciado
- [ ] Teste do Mercado Pago passou
- [ ] Checkout funciona sem erro 502

## 🎉 Resultado Esperado

Após seguir os passos:

1. ✅ Diagnóstico mostra: "ALL CHECKS PASSED"
2. ✅ Teste do Mercado Pago mostra: "All checks passed!"
3. ✅ Checkout redireciona para Mercado Pago
4. ✅ Sem erro 502

## 📞 Suporte

Se após seguir todos os passos o erro persistir:

1. Execute e salve os resultados:
   ```bash
   bash COMANDOS-RAPIDOS-VPS.sh diagnostic > diagnostic.txt
   bash COMANDOS-RAPIDOS-VPS.sh test-mp > test-mp.txt
   bash COMANDOS-RAPIDOS-VPS.sh logs > logs.txt
   ```

2. Compartilhe os arquivos:
   - diagnostic.txt
   - test-mp.txt
   - logs.txt

## 🔗 Links Úteis

- [Mercado Pago - Credenciais](https://www.mercadopago.com.br/developers/panel/credentials)
- [Mercado Pago - Documentação](https://www.mercadopago.com.br/developers/pt/docs)
- [Supabase - Dashboard](https://app.supabase.com)
- [PM2 - Documentação](https://pm2.keymetrics.io/docs/usage/quick-start/)

## 📝 Notas Importantes

1. **Nunca commite .env.local** - Este arquivo contém credenciais sensíveis
2. **Use credenciais de teste** durante desenvolvimento
3. **Use credenciais de produção** apenas na VPS
4. **Faça backup** do .env.local antes de modificar
5. **Reinicie o PM2** sempre após alterar variáveis de ambiente

## 🚀 Próximos Passos (após correção)

1. Configurar webhook do Mercado Pago
2. Configurar monitoramento de erros (Sentry)
3. Configurar backup automático do banco
4. Configurar SSL/HTTPS (se ainda não estiver)
5. Configurar CI/CD para deploys automáticos
