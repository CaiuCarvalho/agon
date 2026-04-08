# 📑 Índice de Arquivos - Diagnóstico e Correção do Erro 502

## 🎯 Arquivos Principais (Comece Aqui)

### 1. **LEIA-ME-PRIMEIRO.md**
- **O que é:** Visão geral completa de tudo
- **Quando usar:** Primeira leitura, entender o contexto geral
- **Conteúdo:**
  - Situação atual
  - Solução em 3 comandos
  - Lista de todos os arquivos
  - Fluxo completo
  - Checklist

### 2. **INICIO-AQUI.md**
- **O que é:** Guia rápido visual para começar
- **Quando usar:** Quer começar imediatamente
- **Conteúdo:**
  - Solução rápida (5 minutos)
  - Fluxo visual
  - Comandos essenciais
  - Problemas comuns

### 3. **upload-to-vps.sh**
- **O que é:** Script para upload automático de todos os arquivos
- **Quando usar:** Primeira vez, para enviar tudo para VPS
- **Como usar:**
  ```bash
  bash upload-to-vps.sh user@vps-ip /path/to/app
  ```
- **O que faz:**
  - Verifica arquivos locais
  - Testa conexão SSH
  - Faz upload de tudo
  - Configura permissões
  - Oferece conectar na VPS

---

## 🔧 Scripts de Configuração (Na VPS)

### 4. **configure-env-vps.sh**
- **O que é:** Configuração interativa das variáveis de ambiente
- **Quando usar:** Primeira configuração ou reconfiguração
- **Como usar:**
  ```bash
  bash configure-env-vps.sh
  ```
- **O que faz:**
  - Pergunta cada variável necessária
  - Valida formato das variáveis
  - Cria arquivo .env.local
  - Mostra resumo da configuração
  - Indica próximos passos

### 5. **COMANDOS-RAPIDOS-VPS.sh**
- **O que é:** Coleção de comandos úteis para diagnóstico e manutenção
- **Quando usar:** Diagnóstico, rebuild, ver logs
- **Como usar:**
  ```bash
  bash COMANDOS-RAPIDOS-VPS.sh [comando]
  ```
- **Comandos disponíveis:**
  - `diagnostic` - Diagnóstico completo
  - `test-mp` - Testar Mercado Pago
  - `check-env` - Verificar variáveis
  - `rebuild` - Rebuild e restart
  - `logs` - Ver logs do PM2
  - `nginx-logs` - Ver logs do Nginx
  - `fix-env` - Criar .env.local do template
  - `help` - Ajuda

---

## 🔍 Scripts de Diagnóstico (Na VPS)

### 6. **diagnose-vps-env.js**
- **O que é:** Script Node.js para diagnóstico completo de variáveis
- **Quando usar:** Verificar se tudo está configurado corretamente
- **Como usar:**
  ```bash
  cd apps/web
  node ../../diagnose-vps-env.js
  ```
- **O que verifica:**
  - Todas as variáveis obrigatórias
  - Formato e validade das variáveis
  - Arquivos .env existentes
  - Build do Next.js
  - Processos PM2
  - Variáveis de ambiente do PM2
- **Resultado:**
  - ✓ ALL CHECKS PASSED (tudo OK)
  - ✗ CRITICAL ERRORS FOUND (precisa corrigir)
  - ⚠ WARNINGS FOUND (opcional)

### 7. **test-mercadopago-vps.js**
- **O que é:** Script Node.js para testar integração com Mercado Pago
- **Quando usar:** Verificar se token e API estão funcionando
- **Como usar:**
  ```bash
  cd apps/web
  node ../../test-mercadopago-vps.js
  ```
- **O que testa:**
  - Token configurado
  - Formato do token (APP_USR-)
  - Conectividade com API
  - Validade do token
  - Estrutura da requisição
- **Resultado:**
  - ✓ All checks passed! (tudo OK)
  - ✗ Test Failed (precisa corrigir)

---

## 📚 Documentação Completa

### 8. **README-DIAGNOSTICO-502.md**
- **O que é:** Documentação completa e detalhada
- **Quando usar:** Referência completa, entender tudo em detalhes
- **Conteúdo:**
  - Resumo executivo
  - Causa raiz confirmada
  - Solução rápida
  - Descrição de todos os arquivos
  - Variáveis obrigatórias
  - Fluxo de diagnóstico
  - Problemas comuns
  - Checklist
  - Links úteis

### 9. **GUIA-DIAGNOSTICO-VPS.md**
- **O que é:** Guia passo a passo detalhado para troubleshooting
- **Quando usar:** Problemas persistem, precisa de diagnóstico avançado
- **Conteúdo:**
  - Passo 1: Diagnóstico automático
  - Passo 2: Corrigir variáveis
  - Passo 3: Rebuild e restart
  - Passo 4: Verificar correção
  - Passo 5: Diagnóstico avançado
  - Passo 6: Checklist
  - Problemas comuns e soluções
  - Próximos passos

---

## 📊 Matriz de Uso

| Situação | Arquivo Recomendado |
|----------|---------------------|
| Primeira vez, não sei por onde começar | **LEIA-ME-PRIMEIRO.md** |
| Quero começar rápido | **INICIO-AQUI.md** |
| Preciso enviar arquivos para VPS | **upload-to-vps.sh** |
| Preciso configurar variáveis | **configure-env-vps.sh** |
| Quero fazer diagnóstico | **COMANDOS-RAPIDOS-VPS.sh diagnostic** |
| Quero testar Mercado Pago | **test-mercadopago-vps.js** |
| Preciso fazer rebuild | **COMANDOS-RAPIDOS-VPS.sh rebuild** |
| Quero ver logs | **COMANDOS-RAPIDOS-VPS.sh logs** |
| Erro persiste, preciso troubleshooting | **GUIA-DIAGNOSTICO-VPS.md** |
| Quero entender tudo em detalhes | **README-DIAGNOSTICO-502.md** |

---

## 🎯 Fluxo Recomendado de Leitura

### Para Iniciantes
1. **LEIA-ME-PRIMEIRO.md** (5 min)
2. **INICIO-AQUI.md** (3 min)
3. Executar scripts
4. Se houver problemas → **GUIA-DIAGNOSTICO-VPS.md**

### Para Experientes
1. **INICIO-AQUI.md** (2 min)
2. Executar scripts
3. Se houver problemas → **README-DIAGNOSTICO-502.md**

---

## 🔄 Fluxo de Execução dos Scripts

```
┌─────────────────────────────────────┐
│  Máquina Local                      │
└─────────────────────────────────────┘
         │
         │ 1. upload-to-vps.sh
         │    (Upload de todos os arquivos)
         ▼
┌─────────────────────────────────────┐
│  VPS - Configuração                 │
└─────────────────────────────────────┘
         │
         │ 2. configure-env-vps.sh
         │    (Configurar variáveis)
         ▼
┌─────────────────────────────────────┐
│  VPS - Diagnóstico                  │
└─────────────────────────────────────┘
         │
         │ 3. COMANDOS-RAPIDOS-VPS.sh diagnostic
         │    ou diagnose-vps-env.js
         │    (Verificar configuração)
         ▼
┌─────────────────────────────────────┐
│  VPS - Teste Mercado Pago           │
└─────────────────────────────────────┘
         │
         │ 4. test-mercadopago-vps.js
         │    (Testar integração)
         ▼
┌─────────────────────────────────────┐
│  VPS - Rebuild                      │
└─────────────────────────────────────┘
         │
         │ 5. COMANDOS-RAPIDOS-VPS.sh rebuild
         │    (Rebuild e restart)
         ▼
┌─────────────────────────────────────┐
│  Navegador - Teste                  │
└─────────────────────────────────────┘
         │
         │ 6. Testar checkout
         ▼
    ✅ Sucesso!
```

---

## 📝 Resumo dos Arquivos por Tipo

### 📖 Documentação (Leitura)
- LEIA-ME-PRIMEIRO.md
- INICIO-AQUI.md
- README-DIAGNOSTICO-502.md
- GUIA-DIAGNOSTICO-VPS.md
- INDICE-ARQUIVOS.md (este arquivo)

### 🔧 Scripts Bash (Executáveis)
- upload-to-vps.sh
- configure-env-vps.sh
- COMANDOS-RAPIDOS-VPS.sh

### 🔍 Scripts Node.js (Diagnóstico)
- diagnose-vps-env.js
- test-mercadopago-vps.js

---

## ⏱️ Tempo de Leitura/Execução

| Arquivo | Tempo |
|---------|-------|
| LEIA-ME-PRIMEIRO.md | 5 min (leitura) |
| INICIO-AQUI.md | 3 min (leitura) |
| upload-to-vps.sh | 1 min (execução) |
| configure-env-vps.sh | 5 min (execução) |
| diagnose-vps-env.js | 30 seg (execução) |
| test-mercadopago-vps.js | 30 seg (execução) |
| COMANDOS-RAPIDOS-VPS.sh rebuild | 3 min (execução) |
| README-DIAGNOSTICO-502.md | 10 min (leitura) |
| GUIA-DIAGNOSTICO-VPS.md | 15 min (leitura) |

**Total para correção completa: ~10-15 minutos**

---

## 🎯 Próximos Passos

1. Leia **LEIA-ME-PRIMEIRO.md** ou **INICIO-AQUI.md**
2. Execute **upload-to-vps.sh**
3. Execute **configure-env-vps.sh**
4. Execute **COMANDOS-RAPIDOS-VPS.sh rebuild**
5. Teste o checkout

**Boa sorte! 🚀**
