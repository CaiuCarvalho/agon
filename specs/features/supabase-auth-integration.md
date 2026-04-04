# Spec: Autenticação Real com Supabase Auth

> **Locação Pretendida:** `/apps/web/src/lib/supabase`, `/apps/web/src/context/AuthContext.tsx`, `/apps/web/src/components/auth/*`

## 1. Contexto Sintetizado

Substituição completa do sistema de autenticação mock atual por integração real com **Supabase Auth**. Esta feature é a fundação arquitetural do sistema Agon, pois todas as funcionalidades subsequentes (carrinho persistente, pedidos, checkout, perfil, wishlist) dependem diretamente de um usuário autenticado validado pelo backend.

**Componentes Afetados:**
- `AuthContext.tsx` — reescrita total para usar Supabase Client
- `LoginForm.tsx` — integração com `supabase.auth.signInWithPassword()`
- `RegisterForm.tsx` — integração com `supabase.auth.signUp()`
- `useAuth.ts` — mantém interface, muda implementação interna
- Criação de `lib/supabase/client.ts` e `lib/supabase/server.ts`

## 2. A Debilidade / Abstenção Local (Problema)

**Problema Atual:**
- Autenticação completamente mockada via localStorage + cookies manuais
- Não há backend real validando credenciais
- JWT "fake" armazenado localmente sem validação criptográfica
- Impossibilidade de implementar features reais (pedidos, pagamentos, admin) sem autenticação verdadeira
- Violação da **Domain Rule #3** (Segurança Isolada do Roteiro) — não há validação server-side real

**Impacto:**
- Sistema não pode ir para produção com dados reais
- Impossível integrar com Stripe, Resend, ou qualquer serviço que exija usuário autenticado
- Risco de segurança crítico (qualquer usuário pode forjar tokens)

## 3. O Escopo Abstrato Desenhado Restritivo (Solução Pura Focada)

### 3.1. Integração Supabase Auth

**Client-Side (`lib/supabase/client.ts`):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Server-Side (`lib/supabase/server.ts`):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### 3.2. Fluxos de Autenticação

**Cadastro (Sign Up):**
1. Usuário preenche formulário (nome, email, senha)
2. Frontend chama `supabase.auth.signUp({ email, password, options: { data: { name } } })`
3. Supabase cria usuário em `auth.users`
4. Trigger automático cria registro em `public.profiles`
5. Frontend recebe sessão e armazena via cookies (gerenciado pelo Supabase)
6. Redirect para home ou página de confirmação de email (se habilitado)

**Login (Sign In):**
1. Usuário preenche email + senha
2. Frontend chama `supabase.auth.signInWithPassword({ email, password })`
3. Supabase valida credenciais
4. Retorna sessão com `access_token` e `refresh_token`
5. Cookies gerenciados automaticamente pelo Supabase SSR
6. Redirect para página solicitada ou home

**Sessão Persistente:**
1. `AuthContext` inicializa com `supabase.auth.getSession()`
2. Listener `supabase.auth.onAuthStateChange()` detecta mudanças
3. Sessão renovada automaticamente via `refresh_token`
4. Sincronização entre abas via `localStorage` events

**Logout:**
1. Usuário clica em "Sair"
2. Frontend chama `supabase.auth.signOut()`
3. Cookies limpos automaticamente
4. Estado local resetado
5. Redirect para `/login`

### 3.3. Estrutura de Banco de Dados

**Tabela `public.profiles`:**
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  tax_id TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.4. Variáveis de Ambiente

**Adicionar em `.env.local` e `.env.production`:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (para emails futuros)
RESEND_API_KEY=re_...
```

## 4. Matriz Contratual Cega & Restritiva Global (Regras & Constraints)

### 4.1. Conformidade com Domain Rules

**Domain Rule #3 (Segurança Isolada do Roteiro):**
- ✅ Autenticação server-side via Supabase Auth (JWT validado pelo backend)
- ✅ RLS (Row Level Security) habilitado em todas as tabelas
- ✅ Middleware Next.js protege rotas `/admin` e `/perfil`
- ✅ Tokens gerenciados via cookies HTTP-only (não acessíveis via JS)

**Domain Rule #1 (Integridade de Preços):**
- ✅ `user.id` será usado como chave em pedidos futuros
- ✅ Backend (Supabase) valida identidade antes de criar pedidos

### 4.2. Constraints Técnicos

**Obrigatório:**
- Usar `@supabase/ssr` (não `@supabase/supabase-js` direto)
- Cookies gerenciados pelo Supabase (não manual via `js-cookie`)
- RLS habilitado em todas as tabelas
- Trigger automático para criar `profiles` ao cadastrar

**Proibido:**
- ❌ Armazenar senha no frontend
- ❌ Usar `service_role` key no frontend
- ❌ Manipular JWT manualmente
- ❌ Armazenar tokens em localStorage (usar cookies)

### 4.3. Dependências

**Novas Dependências:**
```json
{
  "@supabase/ssr": "^0.5.2",
  "@supabase/supabase-js": "^2.45.4"
}
```

**Remover:**
- `js-cookie` (substituído por cookies do Supabase)

## 5. Limiares de Proteção Contra Caos Variáveis (Edge Cases)

### 5.1. Network Timeout / Falha de Conexão

**Cenário:** Supabase fora do ar ou timeout na requisição.

**Comportamento:**
- Exibir toast de erro: "Erro de conexão. Tente novamente."
- Manter formulário preenchido (não limpar campos)
- Botão de submit volta ao estado normal (não fica travado)
- Não redirecionar usuário

**Implementação:**
```typescript
try {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
} catch (error) {
  if (error.message.includes('timeout')) {
    toast.error('Conexão lenta. Tente novamente.')
  } else {
    toast.error(error.message || 'Erro ao fazer login.')
  }
}
```

### 5.2. Email Já Cadastrado

**Cenário:** Usuário tenta cadastrar com email existente.

**Comportamento:**
- Supabase retorna erro: `User already registered`
- Exibir toast: "Este e-mail já está cadastrado. Faça login."
- Oferecer botão para ir para tela de login

### 5.3. Senha Incorreta

**Cenário:** Usuário erra senha no login.

**Comportamento:**
- Supabase retorna erro: `Invalid login credentials`
- Exibir toast: "E-mail ou senha incorretos."
- Não especificar qual campo está errado (segurança)
- Oferecer link "Esqueci minha senha"

### 5.4. Sessão Expirada

**Cenário:** `refresh_token` expirou (usuário ficou 7 dias sem acessar).

**Comportamento:**
- `supabase.auth.getSession()` retorna `null`
- `AuthContext` detecta e limpa estado
- Redirect automático para `/login` com query param `?redirect=/perfil`
- Toast: "Sua sessão expirou. Faça login novamente."

### 5.5. Confirmação de Email (Opcional)

**Cenário:** Supabase configurado para exigir confirmação de email.

**Comportamento:**
- Após cadastro, exibir mensagem: "Verifique seu e-mail para confirmar a conta."
- Usuário não consegue fazer login até confirmar
- Oferecer botão "Reenviar e-mail de confirmação"

## 6. Tranca Lineamentar (Critérios de Aceitação)

### 6.1. Cadastro (Sign Up)

- [ ] **AC1:** Ao preencher nome, email e senha válidos e clicar em "Criar Conta", o sistema chama `supabase.auth.signUp()` e cria usuário em `auth.users`.
- [ ] **AC2:** Trigger automático cria registro em `public.profiles` com `id`, `email` e `name`.
- [ ] **AC3:** Após cadastro bem-sucedido, usuário é redirecionado para home (`/`) com sessão ativa.
- [ ] **AC4:** Se email já existe, exibe toast: "Este e-mail já está cadastrado."
- [ ] **AC5:** Se senha tem menos de 6 caracteres, validação Zod bloqueia submit e exibe erro no campo.

### 6.2. Login (Sign In)

- [ ] **AC6:** Ao preencher email e senha corretos e clicar em "Entrar", o sistema chama `supabase.auth.signInWithPassword()` e retorna sessão.
- [ ] **AC7:** Após login bem-sucedido, usuário é redirecionado para página solicitada (query param `?redirect=`) ou home.
- [ ] **AC8:** Se credenciais incorretas, exibe toast: "E-mail ou senha incorretos."
- [ ] **AC9:** Cookies de sessão são criados automaticamente pelo Supabase SSR.

### 6.3. Sessão Persistente

- [ ] **AC10:** Ao recarregar a página (`F5`), `AuthContext` chama `supabase.auth.getSession()` e recupera usuário logado.
- [ ] **AC11:** Se sessão válida, `isAuthenticated` retorna `true` e `user` contém dados do perfil.
- [ ] **AC12:** Se sessão expirada, `isAuthenticated` retorna `false` e usuário é redirecionado para `/login`.
- [ ] **AC13:** Listener `onAuthStateChange` detecta mudanças de sessão (login em outra aba, logout, etc.) e sincroniza estado.

### 6.4. Logout

- [ ] **AC14:** Ao clicar em "Sair", o sistema chama `supabase.auth.signOut()` e limpa cookies.
- [ ] **AC15:** Estado local (`user`, `token`) é resetado para `null`.
- [ ] **AC16:** Usuário é redirecionado para `/login`.
- [ ] **AC17:** Ao tentar acessar rota protegida após logout, middleware redireciona para `/login?redirect=/perfil`.

### 6.5. Integração com Banco

- [ ] **AC18:** Tabela `public.profiles` existe com colunas: `id`, `email`, `name`, `avatar_url`, `tax_id`, `phone`, `role`, `created_at`, `updated_at`.
- [ ] **AC19:** RLS habilitado: usuário só pode ler/editar próprio perfil.
- [ ] **AC20:** Trigger `on_auth_user_created` cria registro em `profiles` automaticamente ao cadastrar.

### 6.6. Variáveis de Ambiente

- [ ] **AC21:** `.env.example` atualizado com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **AC22:** Build falha se variáveis não estiverem definidas (validação em `lib/supabase/client.ts`).

## 7. Radiação Opcional Induzida Sistêmica Colateral (Impacto de Escopo Cruzado)

### 7.1. Componentes Afetados

**Reescrita Total:**
- `apps/web/src/context/AuthContext.tsx` — substituir localStorage por Supabase
- `apps/web/src/components/auth/LoginForm.tsx` — trocar fetch manual por `supabase.auth.signInWithPassword()`
- `apps/web/src/components/auth/RegisterForm.tsx` — trocar fetch manual por `supabase.auth.signUp()`

**Criação Nova:**
- `apps/web/src/lib/supabase/client.ts` — Supabase client para uso no frontend
- `apps/web/src/lib/supabase/server.ts` — Supabase client para Server Components e Server Actions
- `apps/web/src/middleware.ts` — proteção de rotas `/admin` e `/perfil`

**Manutenção de Interface:**
- `apps/web/src/hooks/useAuth.ts` — mantém mesma interface, mas usa `AuthContext` reescrito

### 7.2. Dependências Externas

**Adicionar:**
- `@supabase/ssr@^0.5.2`
- `@supabase/supabase-js@^2.45.4`

**Remover:**
- `js-cookie` (não mais necessário)

### 7.3. Migrações de Banco

**SQL a ser executado no Supabase:**
1. Criar tabela `public.profiles`
2. Habilitar RLS
3. Criar policies de leitura/escrita
4. Criar trigger `on_auth_user_created`

### 7.4. Features Futuras Desbloqueadas

Após esta spec, será possível implementar:
- ✅ Carrinho persistente por usuário (FK `user_id`)
- ✅ Pedidos reais (FK `user_id`)
- ✅ Checkout com Stripe (requer usuário autenticado)
- ✅ Perfil de usuário (edição de dados em `profiles`)
- ✅ Wishlist persistente no banco (FK `user_id`)
- ✅ Admin dashboard (proteção via `role = 'admin'`)

## 8. Checklist de Validação (Spec Validation)

### A. Claridade Situacional Universal
- [x] Problema exposto claramente: autenticação mock precisa ser substituída por Supabase Auth
- [x] Interdependências mapeadas: `AuthContext`, `LoginForm`, `RegisterForm`, `useAuth`, novos arquivos em `lib/supabase`

### B. Choque Contra Domínios Imutáveis
- [x] Conformidade com Domain Rule #3 (Segurança): JWT validado server-side, RLS habilitado
- [x] Conformidade com Domain Rule #1 (Integridade): `user.id` será FK em pedidos futuros
- [x] Restrições claras: proibido usar `service_role` no frontend, proibido armazenar senha

### C. Cobertura de Edge Cases
- [x] Network timeout: toast de erro, formulário mantém dados
- [x] Email já cadastrado: toast específico, oferecer login
- [x] Senha incorreta: toast genérico (segurança)
- [x] Sessão expirada: redirect para login com query param
- [x] Confirmação de email: mensagem clara, botão de reenvio

### D. Critérios de Aceitação Testáveis
- [x] 22 critérios de aceitação definidos
- [x] Todos são testáveis manualmente ou via automação
- [x] Nenhum critério ambíguo ou filosófico

---

**Status:** ✅ Spec validada e pronta para implementação

**Próximos Passos:**
1. Criar banco Supabase e executar SQL de migração
2. Adicionar variáveis de ambiente
3. Instalar dependências (`@supabase/ssr`, `@supabase/supabase-js`)
4. Implementar código seguindo exatamente esta spec
5. Testar todos os 22 critérios de aceitação
6. Validar com `npx tsc` (zero erros)
7. Commit e PR
