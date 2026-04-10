# 🚀 Guia Rápido de Deploy no VPS

**Data**: 10/04/2026  
**Objetivo**: Aplicar correções do Next.js 15 e limpeza do codebase no VPS

---

## ⚡ Comandos Rápidos

### 1. Push para o Repositório
```bash
# No seu computador local
git push origin main
```

### 2. Deploy no VPS
```bash
# SSH no VPS
ssh user@vps

# Navegar para o projeto
cd /var/www/agon/app

# Pull das mudanças
git pull origin main

# Navegar para o app web
cd apps/web

# Limpar cache do Next.js
rm -rf .next

# Rebuild (isso vai demorar alguns minutos)
npm run build

# Reiniciar PM2
pm2 restart agon-web
pm2 save
```

### 3. Verificação
```bash
# Verificar logs do PM2
pm2 logs agon-web --lines 50

# Verificar status
pm2 status

# Testar aplicação
curl http://localhost:3000
```

---

## 🔍 O Que Foi Corrigido

### Erro Original
```
Type error: Route "src/app/api/admin/orders/[id]/route.ts" has an invalid "GET" export:
Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

### Solução Aplicada
- ✅ 5 rotas API corrigidas para Next.js 15
- ✅ Params agora são `Promise<{}>` e são await
- ✅ 6 arquivos temporários removidos
- ✅ Console.log desnecessários limpos

---

## ✅ Checklist de Verificação

Após o deploy, verifique:

- [ ] Build completou sem erros
- [ ] PM2 mostra status "online"
- [ ] Aplicação responde em `http://localhost:3000`
- [ ] Painel admin acessível em `/admin`
- [ ] Nenhum erro nos logs do PM2

---

## 🆘 Troubleshooting

### Se o build falhar:
```bash
# Limpar completamente
cd /var/www/agon/app/apps/web
rm -rf .next
rm -rf node_modules
rm -rf .turbo

# Reinstalar dependências
npm install

# Rebuild
npm run build
```

### Se o PM2 não reiniciar:
```bash
# Parar e iniciar novamente
pm2 stop agon-web
pm2 start agon-web
pm2 save
```

### Verificar versão do Next.js:
```bash
cd /var/www/agon/app/apps/web
npm list next
```
Deve mostrar: `next@15.5.14`

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `CODEBASE_CLEANUP_REPORT.md` - Relatório completo da limpeza
- `FIX-VPS-BUILD-ERROR.md` - Detalhes técnicos da correção

---

**Tempo estimado**: 5-10 minutos (incluindo rebuild)  
**Última atualização**: 10/04/2026
