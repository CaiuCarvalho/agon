# Pendências manuais — PR #3 (`claude/fix-database-connection-SEoqY`)

Contexto: o PR corrige a causa-raiz (produtos não aparecem em staging/prod)
injetando `SupabaseClient`, falhando-alto em env inválido, logando erros de
fetch de forma estruturada e habilitando migrações automáticas via CI. Tudo
isso só vale se as migrações existirem no banco — e elas nunca rodaram.

## 1. Aplicar as migrações nos dois projetos Supabase

Fallback imediato, sem depender de secrets:

1. Abrir o **Supabase Dashboard → projeto staging → SQL Editor**.
2. Colar o conteúdo de `supabase/ALL_MIGRATIONS_BUNDLE.sql` (6731 linhas,
   35 migrações consolidadas em `BEGIN/COMMIT`).
3. Executar. Validar:
   ```sql
   SELECT count(*) FROM public.products WHERE deleted_at IS NULL;
   SELECT name FROM public.products ORDER BY name LIMIT 5;
   ```
4. Se a contagem for zero, popular com seed (ou cadastrar via admin).
5. Repetir **o mesmo** no projeto Supabase de **produção** — só depois do
   QA em staging.

> O bundle é idempotente (usa `IF NOT EXISTS`, `DROP POLICY IF EXISTS`,
> etc.). Rodar de novo por engano não quebra, mas prefira rodar uma vez
> por ambiente.

## 2. (Opcional) Adicionar secrets de GitHub Actions

Se quiser que migrações rodem automaticamente no próximo deploy, adicionar
em `github.com/CaiuCarvalho/agon/settings/secrets/actions`:

| Secret | Onde pegar |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens (personal) |
| `SUPABASE_PROJECT_ID` | Project Settings → General → Reference ID (**prod**) |
| `SUPABASE_DB_PASSWORD` | Project Settings → Database → Connection string (senha do banco **prod**) |
| `STAGING_SUPABASE_PROJECT_REF` | Reference ID do projeto **staging** |
| `STAGING_SUPABASE_DB_PASSWORD` | Senha do banco **staging** |

Sem esses secrets, o step de migração é pulado (com `::notice::`) e o
deploy segue normal — ou seja, **não bloqueia** se você preferir continuar
aplicando manualmente.

## 3. Merge e validação

1. Merge do PR #3 (`claude/fix-database-connection-SEoqY` → `staging`).
2. Workflow `Deploy to Staging` roda. Monitorar:
   - GitHub Actions UI (veja se o step "Apply Supabase migrations (staging)"
     rodou ou foi pulado — depende de (2))
   - `curl -fsS https://staging.agonimports.com/api/health`
   - Abrir `https://staging.agonimports.com` — produtos devem aparecer
3. Em caso de falha, SSH na VPS:
   ```bash
   pm2 logs agon-staging --lines 200 --nostream | grep -E '\[products\]|\[env\]'
   ```
   Os logs agora são estruturados (`page`, `supabaseUrl`, `code`,
   `message`, `hint` — sem secrets).
4. QA OK em staging → PR `staging` → `main` → deploy de produção →
   mesma validação em `agonimports.com`.

## 4. Checklist de sanidade

- [ ] `supabase/ALL_MIGRATIONS_BUNDLE.sql` aplicado em staging
- [ ] `SELECT count(*) FROM public.products WHERE deleted_at IS NULL;` > 0 em staging
- [ ] PR #3 merged em `staging`
- [ ] Deploy staging verde, health OK, produtos aparecem
- [ ] Bundle aplicado em produção
- [ ] Promoção `staging` → `main` feita
- [ ] Deploy prod verde, produtos aparecem em `agonimports.com`

---

Gerado em 2026-04-21. Arquivo temporário, pode ser deletado após o fluxo
acima estar concluído.
