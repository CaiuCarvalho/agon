# Validação: Autenticação Real com Supabase Auth

## ✅ Implementação Concluída

**Data:** 2026-04-03  
**Status:** Pronto para testes

---

## 📋 Checklist de Critérios de Aceitação

### 6.1. Cadastro (Sign Up)

- [ ] **AC1:** Ao preencher nome, email e senha válidos e clicar em "Criar Conta", o sistema chama `supabase.auth.signUp()` e cria usuário em `auth.users`.
  - **Como testar:** Ir em `/cadastro`, preencher formulário, clicar em "Criar Conta"
  - **Resultado esperado:** Usuário criado, redirect para home, sessão ativa

- [ ] **AC2:** Trigger automático cria registro em `public.profiles` com `id`, `email` e `name`.
  - **Como testar:** Após cadastro, verificar no Supabase Table Editor se registro foi criado em `profiles`
  - **Resultado esperado:** Linha em `profiles` com mesmo `id` do `auth.users`

- [ ] **AC3:** Após cadastro bem-sucedido, usuário é redirecionado para home (`/`) com sessão ativa.
  - **Como testar:** Após cadastro, verificar URL e se Navbar mostra nome do usuário
  - **Resultado esperado:** URL = `/`, Navbar mostra "Olá, [Nome]"

- [ ] **AC4:** Se email já existe, exibe toast: "Este e-mail já está cadastrado."
  - **Como testar:** Tentar cadastrar com email já usado
  - **Resultado esperado:** Toast vermelho com mensagem específica

- [ ] **AC5:** Se senha tem menos de 6 caracteres, validação Zod bloqueia submit e exibe erro no campo.
  - **Como testar:** Digitar senha com 5 caracteres e tentar submeter
  - **Resultado esperado:** Erro vermelho abaixo do campo, botão não envia

### 6.2. Login (Sign In)

- [ ] **AC6:** Ao preencher email e senha corretos e clicar em "Entrar", o sistema chama `supabase.auth.signInWithPassword()` e retorna sessão.
  - **Como testar:** Ir em `/login`, preencher credenciais corretas, clicar em "Entrar"
  - **Resultado esperado:** Login bem-sucedido, redirect para home

- [ ] **AC7:** Após login bem-sucedido, usuário é redirecionado para página solicitada (query param `?redirect=`) ou home.
  - **Como testar:** Acessar `/perfil` sem estar logado (redirect para `/login?redirect=/perfil`), fazer login
  - **Resultado esperado:** Após login, redirect para `/perfil`

- [ ] **AC8:** Se credenciais incorretas, exibe toast: "E-mail ou senha incorretos."
  - **Como testar:** Tentar login com senha errada
  - **Resultado esperado:** Toast vermelho com mensagem genérica

- [ ] **AC9:** Cookies de sessão são criados automaticamente pelo Supabase SSR.
  - **Como testar:** Após login, abrir DevTools > Application > Cookies
  - **Resultado esperado:** Cookies `sb-*-auth-token` presentes

### 6.3. Sessão Persistente

- [ ] **AC10:** Ao recarregar a página (`F5`), `AuthContext` chama `supabase.auth.getSession()` e recupera usuário logado.
  - **Como testar:** Fazer login, recarregar página (`F5`)
  - **Resultado esperado:** Usuário continua logado, Navbar mostra nome

- [ ] **AC11:** Se sessão válida, `isAuthenticated` retorna `true` e `user` contém dados do perfil.
  - **Como testar:** Após login, verificar no React DevTools se `AuthContext` tem `isAuthenticated: true`
  - **Resultado esperado:** Estado correto no contexto

- [ ] **AC12:** Se sessão expirada, `isAuthenticated` retorna `false` e usuário é redirecionado para `/login`.
  - **Como testar:** Limpar cookies manualmente, recarregar página
  - **Resultado esperado:** Redirect para `/login`

- [ ] **AC13:** Listener `onAuthStateChange` detecta mudanças de sessão (login em outra aba, logout, etc.) e sincroniza estado.
  - **Como testar:** Abrir 2 abas, fazer logout em uma
  - **Resultado esperado:** Outra aba detecta logout e redireciona

### 6.4. Logout

- [ ] **AC14:** Ao clicar em "Sair", o sistema chama `supabase.auth.signOut()` e limpa cookies.
  - **Como testar:** Clicar em "Sair" no menu
  - **Resultado esperado:** Cookies limpos, redirect para `/login`

- [ ] **AC15:** Estado local (`user`, `session`) é resetado para `null`.
  - **Como testar:** Após logout, verificar React DevTools
  - **Resultado esperado:** `user: null`, `session: null`

- [ ] **AC16:** Usuário é redirecionado para `/login`.
  - **Como testar:** Após logout, verificar URL
  - **Resultado esperado:** URL = `/login`

- [ ] **AC17:** Ao tentar acessar rota protegida após logout, middleware redireciona para `/login?redirect=/perfil`.
  - **Como testar:** Fazer logout, tentar acessar `/perfil` diretamente
  - **Resultado esperado:** Redirect para `/login?redirect=/perfil`

### 6.5. Integração com Banco

- [ ] **AC18:** Tabela `public.profiles` existe com colunas: `id`, `email`, `name`, `avatar_url`, `tax_id`, `phone`, `role`, `created_at`, `updated_at`.
  - **Como testar:** Verificar no Supabase Table Editor
  - **Resultado esperado:** Tabela com estrutura correta

- [ ] **AC19:** RLS habilitado: usuário só pode ler/editar próprio perfil.
  - **Como testar:** Tentar acessar perfil de outro usuário via SQL
  - **Resultado esperado:** Acesso negado

- [ ] **AC20:** Trigger `on_auth_user_created` cria registro em `profiles` automaticamente ao cadastrar.
  - **Como testar:** Cadastrar novo usuário, verificar se `profiles` foi populado
  - **Resultado esperado:** Registro criado automaticamente

### 6.6. Variáveis de Ambiente

- [ ] **AC21:** `.env.example` atualizado com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - **Como testar:** Verificar arquivo `.env.example`
  - **Resultado esperado:** Variáveis documentadas

- [ ] **AC22:** Build falha se variáveis não estiverem definidas (validação em `lib/supabase/client.ts`).
  - **Como testar:** Remover env vars, tentar buildar
  - **Resultado esperado:** Erro de build claro

---

## 🧪 Testes Manuais Recomendados

### Fluxo Completo (Happy Path)

1. **Cadastro:**
   ```
   1. Ir em /cadastro
   2. Preencher: Nome, Email, Senha (6+ chars)
   3. Clicar em "Criar Conta"
   4. Verificar redirect para /
   5. Verificar Navbar mostra nome
   ```

2. **Logout:**
   ```
   1. Clicar em "Sair"
   2. Verificar redirect para /login
   3. Verificar Navbar não mostra nome
   ```

3. **Login:**
   ```
   1. Ir em /login
   2. Preencher email e senha
   3. Clicar em "Entrar"
   4. Verificar redirect para /
   5. Verificar Navbar mostra nome
   ```

4. **Sessão Persistente:**
   ```
   1. Fazer login
   2. Recarregar página (F5)
   3. Verificar usuário continua logado
   ```

5. **Proteção de Rotas:**
   ```
   1. Fazer logout
   2. Tentar acessar /perfil
   3. Verificar redirect para /login?redirect=/perfil
   4. Fazer login
   5. Verificar redirect para /perfil
   ```

### Edge Cases

1. **Email já cadastrado:**
   ```
   1. Tentar cadastrar com email existente
   2. Verificar toast: "Este e-mail já está cadastrado."
   ```

2. **Senha incorreta:**
   ```
   1. Tentar login com senha errada
   2. Verificar toast: "E-mail ou senha incorretos."
   ```

3. **Senha curta:**
   ```
   1. Tentar cadastrar com senha de 5 caracteres
   2. Verificar erro no campo antes de submeter
   ```

4. **Sincronização entre abas:**
   ```
   1. Abrir 2 abas
   2. Fazer logout em uma
   3. Verificar outra aba detecta e redireciona
   ```

---

## 🔍 Verificação de Código

- [x] TypeScript: Zero erros (`npx tsc --noEmit`)
- [x] Conformidade com Domain Rules
- [x] Nenhum mock restante
- [x] Cookies gerenciados pelo Supabase (não manual)
- [x] RLS habilitado
- [x] Middleware protege rotas `/admin` e `/perfil`

---

## 📦 Arquivos Criados/Modificados

### Criados:
- `apps/web/src/lib/supabase/client.ts`
- `apps/web/src/lib/supabase/server.ts`
- `apps/web/src/middleware.ts`
- `specs/features/supabase-auth-integration.md`
- `specs/features/supabase-auth-integration-validation.md`

### Modificados:
- `apps/web/src/context/AuthContext.tsx` (reescrita total)
- `apps/web/src/hooks/useAuth.ts` (interface mantida, implementação mudou)
- `apps/web/src/components/auth/LoginForm.tsx` (integração Supabase)
- `apps/web/src/components/auth/RegisterForm.tsx` (integração Supabase)
- `apps/web/.env.production` (adicionadas vars Supabase)
- `.env.example` (documentação atualizada)
- `apps/web/package.json` (dependências Supabase)

---

## ✅ Próximos Passos

1. **Testar localmente:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Validar todos os 22 critérios de aceitação** (checklist acima)

3. **Deploy na VPS:**
   ```bash
   git add .
   git commit -m "feat: integração Supabase Auth (spec completa)"
   git push
   
   # Na VPS:
   cd /var/www/agon/app
   ./deploy.sh
   ```

4. **Testar em produção** (mesmos testes do checklist)

5. **Marcar spec como concluída** e partir para próxima feature: **Catálogo de Produtos (CRUD)**

---

**Status Final:** ✅ Implementação completa, pronta para validação
