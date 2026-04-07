# 🚀 Deploy Rápido no VPS - Agon

Para mudanças apenas de código (sem novas dependências ou migrations).

---

## Deploy em 3 Comandos

```bash
# 1. Conectar ao VPS
ssh usuario@187.127.13.56

# 2. Navegar e atualizar
cd /var/www/agon/app
git pull origin main

# 3. Build e restart
npm run build && pm2 restart agon-web
```

Pronto! ✅

---

## Verificar se funcionou

```bash
# Ver status
pm2 status

# Ver logs (últimas 20 linhas)
pm2 logs agon-web --lines 20 --nostream
```

---

## Quando usar o script completo (deploy-to-vps.sh)?

Use `./deploy-to-vps.sh` apenas quando:
- Adicionar novas dependências (package.json mudou)
- Primeira vez fazendo deploy
- Quiser verificações extras de segurança

---

## Se der erro no build

```bash
# Limpar cache e tentar novamente
rm -rf apps/web/.next
npm run build
pm2 restart agon-web
```

---

## Se der erro 502 após deploy

```bash
# Ver logs de erro
pm2 logs agon-web --err --lines 50

# Verificar variáveis de ambiente
cat apps/web/.env.local | grep -E "MERCADOPAGO|SUPABASE|APP_URL"

# Testar localmente
curl http://localhost:3000
```

---

**Resumo:** Para este deploy específico, apenas `git pull` + `build` + `restart` é suficiente! 🎯
