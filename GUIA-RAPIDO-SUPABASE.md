# 🚀 Guia Rápido: Aplicar Migrations no Supabase

## ⚡ 3 Passos Simples

### 1️⃣ Abrir Supabase SQL Editor

```
https://supabase.com/dashboard
→ Selecione seu projeto
→ Menu lateral: "SQL Editor"
→ Clique em "+ New Query"
```

### 2️⃣ Copiar e Executar SQL

1. Abra o arquivo: **`supabase-product-catalog-SIMPLES.sql`**
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase (Ctrl+V)
4. Clique em **"Run"** (ou Ctrl+Enter)

### 3️⃣ Verificar

Execute no terminal do projeto:

```bash
npx tsx scripts/check-database.ts
```

Deve mostrar:

```
✅ Conexão OK
✅ products: 4 registros
✅ categories: 4 registros
✅ 4 produtos encontrados:
   - Manto Titular 24/25 I (R$ 349.90) - Estoque: 50
   - Jaqueta Anthem Brasil (R$ 499.90) - Estoque: 30
   - Shorts Oficial Strike (R$ 199.90) - Estoque: 75
   - Bola Profissional CBF (R$ 149.90) - Estoque: 100
```

## ✅ Pronto!

Agora reinicie o servidor:

```bash
npm run dev
```

Acesse: http://localhost:3000

**Os componentes devem aparecer!** 🎉

---

## ❌ Se der erro

### Erro: "syntax error at or near $"

✅ **Solução:** Use o arquivo `supabase-product-catalog-SIMPLES.sql` (não o `supabase-product-catalog-schema.sql`)

### Erro: "function update_updated_at_column() does not exist"

✅ **Solução:** O script SIMPLES já cria essa função. Execute ele completo.

### Erro: "table profiles does not exist"

✅ **Solução:** Execute este SQL primeiro:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

Depois execute o script SIMPLES novamente.

---

## 📁 Arquivos

- ✅ **`supabase-product-catalog-SIMPLES.sql`** ← USE ESTE!
- ❌ `supabase-product-catalog-schema.sql` ← NÃO USE (tem erro de sintaxe)
- 📖 `APLICAR-MIGRATIONS-SUPABASE.md` ← Guia detalhado
- 🔍 `scripts/check-database.ts` ← Script de verificação
