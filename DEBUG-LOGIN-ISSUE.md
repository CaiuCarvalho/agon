# 🔍 Debug: Login Fica em Loading

**Problema:** Botão de login fica em loading infinito  
**Impacto:** Usuários não conseguem fazer login

---

## 🎯 Diagnóstico Rápido

### 1. Abrir Console do Navegador (F12)

Pressione F12 e vá na aba "Console". Procure por erros:

**Erros comuns:**
- ❌ `Failed to fetch` - Problema de conexão com Supabase
- ❌ `Invalid login credentials` - Credenciais incorretas (mas deveria mostrar toast)
- ❌ `Network error` - Problema de rede/CORS
- ❌ `timeout` - Supabase não respondeu a tempo

---

### 2. Verificar Aba "Network" (F12)

1. Abra F12 → Aba "Network"
2. Tente fazer login
3. Procure por requisições para `supabase.co`

**O que verificar:**
- [ ] Requisição para `/auth/v1/token?grant_type=password` foi feita?
- [ ] Status da requisição: 200 (OK) ou erro (400, 401, 500)?
- [ ] Tempo de resposta: < 5s ou timeout?

---

## 🔧 Possíveis Causas e Soluções

### Causa 1: Variáveis de Ambiente Incorretas no VPS

**Sintoma:** Console mostra erro de conexão

**Verificar no VPS:**
```bash
cd /var/www/agon/app
cat apps/web/.env.local | grep SUPABASE
```

**Deve ter:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mroZkoN304nIVzqr1slUyw_vr6azXqF
```

**Se estiver diferente ou ausente:**
```bash
nano apps/web/.env.local
# Adicionar as variáveis corretas
# Salvar: Ctrl+O, Enter, Ctrl+X

# Rebuild e restart
npm run build
pm2 restart agon-web
```

---

### Causa 2: Supabase URL Incorreta

**Sintoma:** Erro de CORS ou "Failed to fetch"

**Verificar:**
- URL do Supabase está correta?
- Projeto do Supabase está ativo?
- Não está usando URL de desenvolvimento em produção?

**Testar conexão:**
```bash
# No VPS
curl https://yyhpqecnxkvtnjdqhwhk.supabase.co/rest/v1/
```

Deve retornar algo, não erro 404.

---

### Causa 3: Usuário Não Existe no Banco

**Sintoma:** Login fica em loading mas sem erro no console

**Verificar no Supabase:**
```sql
-- Ver usuários cadastrados
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

**Se não houver usuários:**
1. Criar usuário de teste no Supabase
2. Ou fazer cadastro pelo site primeiro

---

### Causa 4: Tabela `profiles` Não Existe

**Sintoma:** Login funciona mas fica em loading ao buscar perfil

**Verificar no Supabase:**
```sql
-- Ver se tabela profiles existe
SELECT * FROM profiles LIMIT 1;
```

**Se não existir:**
```sql
-- Criar tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'customer',
  avatar_url TEXT,
  tax_id TEXT,
  phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_zip TEXT,
  shipping_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### Causa 5: Problema no AuthContext

**Sintoma:** Loading infinito sem erros

**Verificar logs do PM2:**
```bash
pm2 logs agon-web --lines 50 | grep -i auth
```

**Procurar por:**
- `[Auth] Error loading profile`
- `[Auth] Error during initialization`

---

### Causa 6: Cache do Navegador

**Sintoma:** Funcionava antes, agora não funciona mais

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Ou abrir em aba anônima (Ctrl+Shift+N)
3. Tentar login novamente

---

## 🧪 Teste Manual Rápido

### Teste 1: Criar Usuário Novo

1. Ir para `/cadastro`
2. Criar conta nova
3. Se cadastro funcionar mas login não, problema é específico do login

### Teste 2: Testar com Credenciais de Teste

**No Supabase SQL Editor:**
```sql
-- Criar usuário de teste (se não existir)
-- Vá em Authentication > Users > Add User
-- Email: teste@agon.com
-- Password: teste123
-- Auto Confirm: ON
```

Tentar login com essas credenciais.

---

## 📊 Checklist de Diagnóstico

Execute na ordem:

- [ ] **Console do navegador** - Tem erros?
- [ ] **Network tab** - Requisição para Supabase foi feita?
- [ ] **Variáveis de ambiente** - Estão corretas no VPS?
- [ ] **Supabase está online** - Projeto está ativo?
- [ ] **Usuário existe** - Tem usuários na tabela auth.users?
- [ ] **Tabela profiles existe** - Query `SELECT * FROM profiles` funciona?
- [ ] **Logs do PM2** - Tem erros de auth?
- [ ] **Cache limpo** - Testou em aba anônima?

---

## 🚨 Solução Rápida (Se nada funcionar)

```bash
# No VPS
cd /var/www/agon/app

# 1. Verificar variáveis
cat apps/web/.env.local

# 2. Se estiver errado, corrigir
nano apps/web/.env.local

# 3. Limpar cache do Next.js
rm -rf apps/web/.next

# 4. Rebuild completo
npm run build

# 5. Restart
pm2 restart agon-web

# 6. Ver logs
pm2 logs agon-web --lines 50
```

---

## 📞 Informações para Debug

**Me envie:**
1. Erro do console do navegador (F12)
2. Status da requisição na aba Network
3. Logs do PM2: `pm2 logs agon-web --lines 50`
4. Resultado de: `cat apps/web/.env.local | grep SUPABASE`

Com essas informações consigo identificar o problema exato! 🎯
