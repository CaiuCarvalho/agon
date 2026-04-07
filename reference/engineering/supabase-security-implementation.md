# Supabase Security Implementation Reference

**Status:** Parcialmente Implementado (30% completo)  
**Data:** 2026-04-04  
**Spec Source:** `.kiro/specs/supabase-security-validation/`

## Overview

Este documento serve como referência para a implementação de segurança do Supabase no e-commerce Agon. Documenta migrations, RLS policies, RPCs atômicos e guias de validação.

## Princípios de Segurança

1. **Defense-in-Depth:** Múltiplas camadas de segurança (RLS > Constraints > App Logic)
2. **Secure by Default:** Segurança ativada desde o início
3. **Operationally Simple:** Um engenheiro pode compreender e manter
4. **Ready for Evolution:** Features avançadas podem ser adicionadas incrementalmente

## Migrations Implementadas

### 1. Cart Items Table (20260404000001)

**Arquivo:** `supabase/migrations/20260404000001_create_cart_items_table.sql`

**Estrutura:**
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 99),
  size TEXT NOT NULL CHECK (char_length(size) > 0 AND char_length(size) <= 10),
  price_snapshot DECIMAL(10, 2) NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_cart_item UNIQUE (user_id, product_id, size)
);
```

**RLS Policies:**
- `cart_items_select_own`: SELECT USING (auth.uid() = user_id)
- `cart_items_insert_own`: INSERT WITH CHECK (auth.uid() = user_id)
- `cart_items_update_own`: UPDATE USING/WITH CHECK (auth.uid() = user_id)
- `cart_items_delete_own`: DELETE USING (auth.uid() = user_id)

**Índices:**
- `idx_cart_items_user_id`
- `idx_cart_items_product_id`
- `idx_cart_items_updated_at`

**Trigger:**
- `update_cart_items_updated_at`: Atualiza updated_at automaticamente

### 2. Wishlist Items Table (20260404000002)

**Arquivo:** `supabase/migrations/20260404000002_create_wishlist_items_table.sql`

**Estrutura:**
```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);
```

**RLS Policies:**
- `wishlist_items_select_own`: SELECT USING (auth.uid() = user_id)
- `wishlist_items_insert_own`: INSERT WITH CHECK (auth.uid() = user_id)
- `wishlist_items_delete_own`: DELETE USING (auth.uid() = user_id)

**Índices:**
- `idx_wishlist_items_user_id`
- `idx_wishlist_items_product_id`
- `idx_wishlist_items_created_at`

### 3. Wishlist Limit Trigger (20260404000003)

**Arquivo:** `supabase/migrations/20260404000003_create_wishlist_limit_trigger.sql`

**Função:**
```sql
CREATE OR REPLACE FUNCTION check_wishlist_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM wishlist_items WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 itens na wishlist atingido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**
```sql
CREATE TRIGGER enforce_wishlist_limit
  BEFORE INSERT ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION check_wishlist_limit();
```

### 4. Cart Migration RPC (20260404000004)

**Arquivo:** `supabase/migrations/20260404000004_create_cart_migration_rpc.sql`

**Função:**
```sql
CREATE OR REPLACE FUNCTION migrate_cart_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
-- Migra itens do localStorage para o banco
-- Usa INSERT ON CONFLICT DO UPDATE para idempotência
-- Retorna: { success: true, migrated_count: N }
$$
```

**Uso:**
```javascript
const { data, error } = await supabase.rpc('migrate_cart_items', {
  p_user_id: user.id,
  p_items: [
    { productId: 'uuid', quantity: 2, size: 'M' },
    { productId: 'uuid', quantity: 1, size: 'L' }
  ]
});
```

### 5. Wishlist Migration RPC (20260404000005)

**Arquivo:** `supabase/migrations/20260404000005_create_wishlist_migration_rpc.sql`

**Função:**
```sql
CREATE OR REPLACE FUNCTION migrate_wishlist_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
-- Migra itens do localStorage para o banco
-- Respeita limite de 20 itens
-- Retorna: { success: true, migrated_count: N, skipped_count: M }
$$
```

### 6. Add to Cart Atomic RPC (20260404000006)

**Arquivo:** `supabase/migrations/20260404000006_create_add_to_cart_atomic_rpc.sql`

**Função:**
```sql
CREATE OR REPLACE FUNCTION add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
RETURNS JSONB AS $$
-- Adiciona item ao carrinho atomicamente
-- Usa INSERT ON CONFLICT para evitar race conditions
-- Captura price snapshot do produto
-- Retorna: { success: true, item: {...} }
$$
```

**Uso:**
```javascript
const { data, error } = await supabase.rpc('add_to_cart_atomic', {
  p_user_id: user.id,
  p_product_id: productId,
  p_quantity: 2,
  p_size: 'M'
});
```

### 7. Cart Items Cross-Field Constraints (20260404000007)

**Arquivo:** `supabase/migrations/20260404000007_add_cart_items_cross_field_constraints.sql`

**Constraints adicionados:**
```sql
-- Price snapshot deve ser positivo
ALTER TABLE cart_items
ADD CONSTRAINT check_price_snapshot_positive
CHECK (price_snapshot > 0);

-- Product name não pode ser vazio
ALTER TABLE cart_items
ADD CONSTRAINT check_product_name_not_empty
CHECK (product_name_snapshot != '' AND char_length(product_name_snapshot) > 0);

-- Prevenir overflow aritmético
ALTER TABLE cart_items
ADD CONSTRAINT check_total_price_overflow
CHECK (quantity * price_snapshot <= 999999);

-- created_at deve ser <= updated_at
ALTER TABLE cart_items
ADD CONSTRAINT check_timestamps_order
CHECK (created_at <= updated_at);
```

### 8. Rate Limit Log Table (20260404000008)

**Arquivo:** `supabase/migrations/20260404000008_create_rate_limit_log_table.sql`

**Estrutura:**
```sql
CREATE TABLE rate_limit_log (
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, operation, timestamp)
);

CREATE INDEX idx_rate_limit_log_user_time 
  ON rate_limit_log(user_id, timestamp DESC);
```

**Propósito:** Rastrear operações de usuários para rate limiting (60 requests/minuto)

## Guias de Implementação

### Migration Guide

**Localização:** `supabase/MIGRATION_GUIDE.md`

**Conteúdo:**
- Como aplicar migrations via Supabase CLI
- Como aplicar migrations via Supabase Dashboard
- Queries de validação para cada componente:
  - Tabelas criadas
  - RLS ativo
  - Constraints ativos
  - Foreign keys com CASCADE
  - Índices criados
  - RLS policies criadas
  - Triggers criados
  - RPC functions criadas
- Troubleshooting comum
- Rollback procedures

### RLS Manual Testing Guide

**Localização:** `supabase/RLS-MANUAL-TESTING-GUIDE.md`

**Conteúdo:**
- Como criar usuários de teste
- Testes de SELECT (isolamento de leitura)
- Testes de INSERT (proteção de escrita)
- Testes de UPDATE (proteção de modificação)
- Testes de DELETE (proteção de deleção)
- Testes via aplicação (frontend)
- Expected results para cada teste
- Troubleshooting de RLS

### Final Validation Checklist

**Localização:** `supabase/FINAL-VALIDATION-CHECKLIST.md`

**Conteúdo:**
- End-to-end flow testing
- Multi-user isolation testing
- Migration testing (localStorage → Database)
- Rate limiting testing
- Security validation (logs, secrets)
- CI/CD validation
- Performance testing
- Final sign-off checklist

## Padrões de Implementação

### RLS Policies Pattern

**Sempre usar:**
```sql
-- SELECT
CREATE POLICY "table_select_own"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "table_insert_own"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "table_update_own"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "table_delete_own"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);
```

### RPC Functions Pattern

**Sempre usar:**
```sql
CREATE OR REPLACE FUNCTION function_name(params)
RETURNS JSONB AS $$
DECLARE
  -- Variables
BEGIN
  -- Logic
  RETURN jsonb_build_object(
    'success', true,
    'data', result
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Atomic Operations Pattern

**Usar INSERT ON CONFLICT:**
```sql
INSERT INTO table_name (columns)
VALUES (values)
ON CONFLICT (unique_constraint)
DO UPDATE SET
  column = EXCLUDED.column,
  updated_at = NOW();
```

## Próximas Implementações Necessárias

### Prioridade ALTA (Crítico para MVP)

1. **Frontend Migration Logic (Seção 5)**
   - Criar `apps/web/src/services/MigrationService.ts`
   - Implementar `migrateUserData()`
   - Implementar migration gate no login
   - Limpar localStorage após sucesso

2. **Environment Validation (Seção 6)**
   - Criar `apps/web/src/lib/env-validation.ts` com Zod
   - Validar que Service Role Key não está no frontend
   - Atualizar `.gitignore`
   - Criar `.env.example` completo

3. **CI/CD Scripts (Seção 10)**
   - Criar `scripts/validate-rls.ts`
   - Criar `scripts/validate-constraints.ts`
   - Criar `scripts/check-secrets.sh`
   - Integrar ESLint security rules

### Prioridade MÉDIA (Importante para Produção)

4. **Rate Limiting Functions (Seção 4)**
   - Criar função `check_rate_limit()`
   - Criar triggers de rate limiting
   - Criar função `cleanup_rate_limit_logs()`

5. **Auth Configuration (Seção 8)**
   - Configurar JWT expiration (1 hora)
   - Configurar refresh token rotation
   - Desabilitar providers não usados

6. **Logging (Seção 9)**
   - Implementar logging estruturado
   - Implementar redaction de dados sensíveis

## Validação de Segurança

### Checklist Mínimo

Antes de considerar o sistema seguro:

- [ ] RLS ativo em todas as tabelas sensíveis
- [ ] Todas as policies criadas e testadas
- [ ] Constraints de banco validados
- [ ] RPCs atômicos funcionando
- [ ] Service Role Key não exposta no frontend
- [ ] Secrets não commitados no git
- [ ] Logs não expõem dados sensíveis
- [ ] Migration de localStorage funciona
- [ ] Isolamento entre usuários validado

### Comandos de Validação

```bash
# Aplicar migrations
supabase db push

# Validar RLS (quando script estiver pronto)
npm run validate:rls

# Validar constraints (quando script estiver pronto)
npm run validate:constraints

# Validar secrets (quando script estiver pronto)
bash scripts/check-secrets.sh
```

## Referências

- **Spec Completo:** `.kiro/specs/supabase-security-validation/`
- **Requirements:** `.kiro/specs/supabase-security-validation/requirements.md`
- **Design:** `.kiro/specs/supabase-security-validation/design.md`
- **Tasks:** `.kiro/specs/supabase-security-validation/tasks.md`
- **Status:** `SUPABASE-SECURITY-IMPLEMENTATION-STATUS.md`

## Notas Importantes

1. **RLS é a camada primária de segurança** - Nunca confiar apenas em validação frontend
2. **Usar ANON_KEY no frontend** - Service Role Key apenas em backend/CI/CD
3. **Migrations são idempotentes** - Podem ser executadas múltiplas vezes
4. **RPCs são SECURITY DEFINER** - Executam com privilégios elevados, validar inputs
5. **Constraints no banco** - Última linha de defesa contra dados inválidos

## Troubleshooting Comum

### RLS não está bloqueando acesso

**Causa:** Service Role Key sendo usada no frontend

**Solução:**
```typescript
// ❌ ERRADO
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ CORRETO
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### Migration falha com "relation already exists"

**Causa:** Migration já foi aplicada

**Solução:**
```bash
# Verificar status
supabase migration list

# Se necessário, dropar e recriar (APENAS EM DEV)
DROP TABLE IF EXISTS cart_items CASCADE;
```

### Rate limiting não funciona

**Causa:** Triggers não foram criados

**Solução:**
```sql
-- Verificar triggers
SELECT * FROM information_schema.triggers 
WHERE event_object_table IN ('cart_items', 'wishlist_items');
```

## Contato e Suporte

Para questões sobre implementação:
1. Consultar este documento
2. Consultar guias em `supabase/`
3. Consultar spec completo em `.kiro/specs/supabase-security-validation/`
