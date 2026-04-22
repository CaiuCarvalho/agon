# Pendências manuais — branch `claude/fix-database-connection-SEoqY`

Contexto: o PR corrige a causa-raiz de produtos não aparecerem
(`Server Component usando browser client`, `env silenciosamente inválida em
prod`, `logs sem contexto`), habilita migrações automáticas no CI quando os
secrets estiverem presentes, e agora inclui **as migrations fundacionais
que nunca existiam**: `profiles`, `categories`, `products`, `addresses` e o
trigger `on_auth_user_created`. Também promove `caiu.lfc@gmail.com` a admin.

## 0. TL;DR — o que você precisa fazer manualmente

1. Aplicar `supabase/ALL_MIGRATIONS_BUNDLE.sql` no **SQL Editor** dos dois
   projetos Supabase (staging e prod).
2. Em cada projeto Supabase, ajustar **Authentication → URL Configuration →
   Site URL + Redirect URLs** para apontar para o domínio real (não
   `localhost:3000`).
3. (Opcional) Adicionar 5 GitHub Actions secrets para que as próximas
   migrações rodem via CI sem cópia-cola.

Nada disso dá pra automatizar daqui sem as credenciais.

## 1. Aplicar o bundle nos dois projetos Supabase

1. Abrir o **Supabase Dashboard → projeto staging → SQL Editor**.
2. Colar o conteúdo de `supabase/ALL_MIGRATIONS_BUNDLE.sql` (38 migrations
   consolidadas em um único `BEGIN/COMMIT`).
3. Rodar. Validar:
   ```sql
   -- tabelas criadas?
   SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name;
   -- trigger de auto-criação de profile ativo?
   SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   -- seu profile foi criado/promovido?
   SELECT id, email, role FROM public.profiles WHERE email = 'caiu.lfc@gmail.com';
   -- produtos (0 é ok, mas o seed opcional fica em supabase/seed-products.sql)
   SELECT count(*) FROM public.products WHERE deleted_at IS NULL;
   ```
4. Repetir **o mesmo** no projeto Supabase de **produção**. O bundle é
   idempotente (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ON CONFLICT
   DO NOTHING`), então rodar em prod onde algumas tabelas já existem
   não quebra nada.
5. Se quiser popular produtos, rodar também `supabase/seed-products.sql`
   no SQL Editor de cada ambiente.

> Se a query de `profiles` não retornar sua linha em staging, significa
> que o usuário foi criado antes da migration rodar E o trigger não existia.
> Rode o bundle: a migration `20260421000001_seed_admin_caiu.sql` faz o
> backfill automaticamente (busca `auth.users` pelo email e insere em
> `profiles`, depois seta `role = 'admin'`).

## 2. Ajustar Site URL e Redirect URLs no Supabase

**Este é o que resolve o `localhost:3000` quebrado no email de confirmação.**

Em cada projeto Supabase (staging e prod), no Dashboard:

1. **Authentication → URL Configuration**
2. **Site URL**:
   - Staging: `https://staging.agonimports.com`
   - Produção: `https://agonimports.com`
3. **Redirect URLs** (lista; adicione todas):
   - Staging:
     - `https://staging.agonimports.com/auth/callback`
     - `https://staging.agonimports.com/**`
   - Produção:
     - `https://agonimports.com/auth/callback`
     - `https://agonimports.com/**`
4. Salvar.

> O código agora passa `emailRedirectTo` no `signUp` usando
> `NEXT_PUBLIC_APP_URL` (configurado nos workflows de deploy). Isso força
> o Supabase a usar o domínio correto, mas o **Site URL** no Dashboard é
> o fallback que ele usa quando a Redirect URL não bate nada — por isso
> precisa estar certo também.

Depois de mudar, peça para o Supabase reenviar o email:

```sql
-- no SQL Editor do projeto:
-- se a conta ainda não estiver confirmada
SELECT email, confirmed_at FROM auth.users WHERE email = 'caiu.lfc@gmail.com';
```

Se `confirmed_at` estiver null, peça um novo "reenviar email" pela tela
de login do site (botão existe em `/login`).

## 3. (Opcional) Automatizar migrações no CI

Para os próximos deploys rodarem `supabase db push --linked` sozinhos, adicionar
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
aplicando o bundle manualmente.

## 4. Validação end-to-end

Depois de (1), (2) e o merge:

1. Workflow `Deploy to Staging` roda. Monitorar:
   - GitHub Actions UI
   - `curl -fsS https://staging.agonimports.com/api/health`
   - Abrir `https://staging.agonimports.com` — produtos devem aparecer
     (após rodar `seed-products.sql` ou cadastrar via admin)
2. **Teste do signup/email**: criar conta nova em staging → clicar no link
   do email → deve cair em `https://staging.agonimports.com/auth/callback?...`
   e redirecionar para `/perfil` já logado.
3. **Teste admin**: logar com `caiu.lfc@gmail.com` → acessar
   `https://staging.agonimports.com/admin` — deve liberar.
4. Se algo falhar, SSH na VPS:
   ```bash
   pm2 logs agon-staging --lines 200 --nostream | grep -E '\[products\]|\[env\]|\[Auth\]'
   ```
   Logs agora são estruturados (sem secrets).
5. QA OK em staging → PR `staging` → `main` → deploy de produção →
   mesma validação em `agonimports.com`.

## 5. Checklist de sanidade

- [ ] Bundle aplicado em **staging**
- [ ] Site URL + Redirect URLs de **staging** ajustados
- [ ] `SELECT role FROM profiles WHERE email = 'caiu.lfc@gmail.com'` = `'admin'` em staging
- [ ] Bundle aplicado em **prod**
- [ ] Site URL + Redirect URLs de **prod** ajustados
- [ ] `SELECT role FROM profiles WHERE email = 'caiu.lfc@gmail.com'` = `'admin'` em prod
- [ ] Merge da branch `claude/fix-database-connection-SEoqY` → `staging`
- [ ] Deploy staging verde, health OK
- [ ] Signup novo em staging → email chega e redireciona pro domínio correto
- [ ] Login com `caiu.lfc@gmail.com` em staging → `/admin` abre
- [ ] Promoção `staging` → `main`
- [ ] Deploy prod verde
- [ ] Mesmos testes em `agonimports.com`

---

Gerado em 2026-04-21. Arquivo temporário, pode ser deletado após o fluxo
acima estar concluído.
