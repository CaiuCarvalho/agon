# Supabase Security - Issues & Improvements

**Data de Análise:** 2026-04-04  
**Analisado por:** Kiro AI  
**Escopo:** Migrations, RLS Policies, RPC Functions

## Executive Summary

Análise detalhada do código implementado identificou **12 issues críticos**, **8 issues importantes** e **15 melhorias recomendadas**. A maioria dos problemas está relacionada a validação de entrada, tratamento de erros e performance.

---

## 🔴 ISSUES CRÍTICOS (Devem ser corrigidos antes de produção)

### 1. RPC Functions sem validação de RLS bypass

**Arquivo:** Todos os RPCs (migrations 004, 005, 006)

**Problema:**
```sql
CREATE OR REPLACE FUNCTION migrate_cart_items(
  p_user_id UUID,  -- ❌ Aceita qualquer user_id
  p_items JSONB
)
```

As funções RPC são `SECURITY DEFINER` mas não validam se o `p_user_id` passado corresponde ao usuário autenticado (`auth.uid()`). Um atacante pode passar qualquer `user_id` e migrar dados para conta de outro usuário.

**Impacto:** 🔴 CRÍTICO - Bypass completo de RLS

**Solução:**
```sql
CREATE OR REPLACE FUNCTION migrate_cart_items(
  p_items JSONB  -- Remove p_user_id do parâmetro
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obter user_id do contexto de autenticação
  v_user_id := auth.uid();
  
  -- Validar que usuário está autenticado
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;
  
  -- Usar v_user_id em vez de p_user_id
  -- ... resto da lógica
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Aplicar em:**
- `migrate_cart_items()`
- `migrate_wishlist_items()`
- `add_to_cart_atomic()`

---

### 2. Wishlist limit trigger tem race condition

**Arquivo:** `20260404000003_create_wishlist_limit_trigger.sql`

**Problema:**
```sql
CREATE OR REPLACE FUNCTION check_wishlist_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM wishlist_items WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 itens na wishlist atingido';
  END IF;
  RETURN NEW;
END;
```

Em operações concorrentes, dois INSERTs simultâneos podem passar pela validação (ambos veem 19 itens) e inserir o 20º e 21º item.

**Impacto:** 🔴 CRÍTICO - Limite de 20 itens pode ser ultrapassado

**Solução:**
```sql
CREATE OR REPLACE FUNCTION check_wishlist_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Lock para prevenir race condition
  SELECT COUNT(*) INTO v_count
  FROM wishlist_items 
  WHERE user_id = NEW.user_id
  FOR UPDATE;
  
  IF v_count >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 itens na wishlist atingido';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. RPC functions não validam tipos de dados JSONB

**Arquivo:** `20260404000004_create_cart_migration_rpc.sql`, `20260404000005_create_wishlist_migration_rpc.sql`

**Problema:**
```sql
FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
LOOP
  -- ❌ Não valida se productId existe
  -- ❌ Não valida se quantity é número
  -- ❌ Não valida se size é string
  (v_item->>'productId')::UUID,
  (v_item->>'quantity')::INTEGER,
  v_item->>'size'
```

Se o JSONB vier malformado, o cast pode falhar com erro genérico.

**Impacto:** 🔴 CRÍTICO - Erro não tratado pode expor informações do sistema

**Solução:**
```sql
BEGIN
  -- Validar estrutura do JSONB
  IF NOT jsonb_typeof(p_items) = 'array' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'p_items deve ser um array'
    );
  END IF;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Validar campos obrigatórios
    IF NOT (v_item ? 'productId' AND v_item ? 'quantity' AND v_item ? 'size') THEN
      CONTINUE; -- Pular item inválido
    END IF;
    
    -- Validar tipos com tratamento de erro
    BEGIN
      v_product_id := (v_item->>'productId')::UUID;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_size := v_item->>'size';
    EXCEPTION
      WHEN OTHERS THEN
        CONTINUE; -- Pular item com tipo inválido
    END;
    
    -- Validar ranges
    IF v_quantity < 1 OR v_quantity > 99 THEN
      CONTINUE;
    END IF;
    
    IF char_length(v_size) < 1 OR char_length(v_size) > 10 THEN
      CONTINUE;
    END IF;
    
    -- ... resto da lógica
  END LOOP;
END;
```

---

### 4. add_to_cart_atomic não valida estoque

**Arquivo:** `20260404000006_create_add_to_cart_atomic_rpc.sql`

**Problema:**
```sql
SELECT price, name, stock INTO v_product
FROM products
WHERE id = p_product_id AND deleted_at IS NULL;

-- ❌ Busca stock mas não valida
```

A função busca o estoque mas não valida se há quantidade suficiente antes de adicionar ao carrinho.

**Impacto:** 🔴 CRÍTICO - Usuários podem adicionar produtos sem estoque

**Solução:**
```sql
-- Fetch product details
SELECT price, name, stock INTO v_product
FROM products
WHERE id = p_product_id AND deleted_at IS NULL;

IF NOT FOUND THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Produto não encontrado'
  );
END IF;

-- Validar estoque disponível
IF v_product.stock IS NOT NULL AND v_product.stock < p_quantity THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Estoque insuficiente',
    'available_stock', v_product.stock
  );
END IF;
```

---

### 5. RLS policies não têm policy para service role

**Arquivo:** `20260404000001_create_cart_items_table.sql`, `20260404000002_create_wishlist_items_table.sql`

**Problema:**
Não há policy explícita para permitir que o service role (usado em migrations e admin) acesse os dados.

**Impacto:** 🔴 CRÍTICO - Migrations e operações admin podem falhar

**Solução:**
```sql
-- Policy para service role (admin operations)
CREATE POLICY "cart_items_service_role_all"
  ON cart_items
  USING (auth.jwt()->>'role' = 'service_role');
```

Ou usar `USING (true)` apenas para service role:
```sql
CREATE POLICY "cart_items_admin_all"
  ON cart_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

### 6. Falta validação de NULL em campos obrigatórios

**Arquivo:** `20260404000006_create_add_to_cart_atomic_rpc.sql`

**Problema:**
```sql
CREATE OR REPLACE FUNCTION add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
```

Não valida se os parâmetros são NULL antes de usar.

**Impacto:** 🔴 CRÍTICO - NULL pode causar comportamento inesperado

**Solução:**
```sql
BEGIN
  -- Validar parâmetros obrigatórios
  IF p_user_id IS NULL OR p_product_id IS NULL OR p_quantity IS NULL OR p_size IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Parâmetros obrigatórios não podem ser NULL'
    );
  END IF;
  
  -- ... resto da lógica
END;
```

---

### 7. migrate_cart_items não valida constraints antes de inserir

**Arquivo:** `20260404000004_create_cart_migration_rpc.sql`

**Problema:**
```sql
INSERT INTO cart_items (...)
VALUES (
  p_user_id,
  (v_item->>'productId')::UUID,
  (v_item->>'quantity')::INTEGER,  -- ❌ Não valida range 1-99
  v_item->>'size',                  -- ❌ Não valida length 1-10
  v_product.price,
  v_product.name
)
```

Se o localStorage tiver dados inválidos (quantity=0, size=''), a inserção falhará com erro de constraint.

**Impacto:** 🔴 CRÍTICO - Migração pode falhar completamente

**Solução:**
```sql
-- Validar quantity
v_quantity := (v_item->>'quantity')::INTEGER;
IF v_quantity < 1 OR v_quantity > 99 THEN
  CONTINUE; -- Pular item inválido
END IF;

-- Validar size
v_size := v_item->>'size';
IF char_length(v_size) < 1 OR char_length(v_size) > 10 THEN
  CONTINUE; -- Pular item inválido
END IF;
```

---

### 8. Falta índice composto para queries comuns

**Arquivo:** `20260404000001_create_cart_items_table.sql`

**Problema:**
```sql
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

Queries que filtram por `user_id` e ordenam por `updated_at` não usam índice eficiente.

**Impacto:** 🟡 IMPORTANTE - Performance degradada com muitos itens

**Solução:**
```sql
-- Índice composto para query comum: SELECT * FROM cart_items WHERE user_id = ? ORDER BY updated_at DESC
CREATE INDEX idx_cart_items_user_updated ON cart_items(user_id, updated_at DESC);

-- Índice composto para unique constraint já existe, mas pode ser otimizado
CREATE INDEX idx_cart_items_user_product_size ON cart_items(user_id, product_id, size);
```

---

### 9. rate_limit_log não tem cleanup automático

**Arquivo:** `20260404000008_create_rate_limit_log_table.sql`

**Problema:**
Tabela crescerá indefinidamente sem cleanup automático.

**Impacto:** 🟡 IMPORTANTE - Crescimento descontrolado do banco

**Solução:**
```sql
-- Adicionar particionamento por timestamp
CREATE TABLE rate_limit_log (
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, operation, timestamp)
) PARTITION BY RANGE (timestamp);

-- Criar partições mensais
CREATE TABLE rate_limit_log_2026_04 PARTITION OF rate_limit_log
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- Ou adicionar TTL via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-rate-limit-logs',
  '0 0 * * *', -- Diariamente à meia-noite
  $$DELETE FROM rate_limit_log WHERE timestamp < NOW() - INTERVAL '24 hours'$$
);
```

---

### 10. Falta validação de tamanho do array em migrations

**Arquivo:** `20260404000004_create_cart_migration_rpc.sql`, `20260404000005_create_wishlist_migration_rpc.sql`

**Problema:**
```sql
FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
LOOP
  -- ❌ Não limita tamanho do array
```

Um atacante pode enviar array com 10.000 itens e causar DoS.

**Impacto:** 🔴 CRÍTICO - Vulnerabilidade de DoS

**Solução:**
```sql
BEGIN
  -- Validar tamanho do array
  IF jsonb_array_length(p_items) > 100 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Máximo de 100 itens por migração'
    );
  END IF;
  
  -- ... resto da lógica
END;
```

---

### 11. update_updated_at_column não valida se updated_at foi modificado manualmente

**Arquivo:** `20260404000001_create_cart_items_table.sql`

**Problema:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();  -- ❌ Sempre sobrescreve
  RETURN NEW;
END;
```

Se alguém tentar fazer `UPDATE cart_items SET updated_at = '2020-01-01'`, o trigger sobrescreve mas não valida se a data é válida.

**Impacto:** 🟢 BAIXO - Comportamento esperado, mas pode ser melhorado

**Solução:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas atualizar se não foi explicitamente modificado
  IF NEW.updated_at = OLD.updated_at THEN
    NEW.updated_at = NOW();
  ELSIF NEW.updated_at < OLD.updated_at THEN
    -- Prevenir updated_at retroativo
    RAISE EXCEPTION 'updated_at não pode ser anterior ao valor atual';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 12. Falta auditoria de quem executou operações SECURITY DEFINER

**Arquivo:** Todos os RPCs

**Problema:**
Funções `SECURITY DEFINER` executam com privilégios elevados mas não registram quem as executou.

**Impacto:** 🟡 IMPORTANTE - Dificulta auditoria de segurança

**Solução:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  function_name TEXT NOT NULL,
  parameters JSONB,
  result JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Em cada RPC function
CREATE OR REPLACE FUNCTION migrate_cart_items(p_items JSONB)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- ... lógica da função
  
  -- Registrar auditoria
  INSERT INTO audit_log (user_id, function_name, parameters, result)
  VALUES (auth.uid(), 'migrate_cart_items', jsonb_build_object('items', p_items), v_result);
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🟡 ISSUES IMPORTANTES (Devem ser corrigidos antes de escala)

### 13. Falta índice para cleanup de rate_limit_log

**Arquivo:** `20260404000008_create_rate_limit_log_table.sql`

**Problema:**
```sql
CREATE INDEX idx_rate_limit_log_user_time 
  ON rate_limit_log(user_id, timestamp DESC);
```

Cleanup por timestamp precisa de índice específico.

**Solução:**
```sql
CREATE INDEX idx_rate_limit_log_timestamp ON rate_limit_log(timestamp);
```

---

### 14. Falta validação de formato de size

**Arquivo:** `20260404000006_create_add_to_cart_atomic_rpc.sql`

**Problema:**
```sql
IF char_length(p_size) < 1 OR char_length(p_size) > 10 THEN
  -- ❌ Não valida formato (P, M, G, GG, etc)
```

**Solução:**
```sql
-- Validar formato de tamanho
IF p_size !~ '^(PP|P|M|G|GG|XG|XXG|[0-9]{2})$' THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Tamanho inválido. Use: PP, P, M, G, GG, XG, XXG ou número (ex: 38)'
  );
END IF;
```

---

### 15. migrate_wishlist_items não valida product_id existe

**Arquivo:** `20260404000005_create_wishlist_migration_rpc.sql`

**Problema:**
```sql
INSERT INTO wishlist_items (user_id, product_id)
VALUES (p_user_id, (v_item->>'productId')::UUID)
-- ❌ Não valida se product existe antes
```

**Solução:**
```sql
-- Validar que produto existe
IF NOT EXISTS (SELECT 1 FROM products WHERE id = v_product_id AND deleted_at IS NULL) THEN
  CONTINUE; -- Pular produto inválido
END IF;
```

---

### 16. Falta constraint para prevenir price_snapshot negativo via UPDATE

**Arquivo:** `20260404000007_add_cart_items_cross_field_constraints.sql`

**Problema:**
Constraint `check_price_snapshot_positive` valida INSERT mas não previne UPDATE malicioso.

**Solução:**
Constraint já previne UPDATE também, mas adicionar trigger para log:
```sql
CREATE OR REPLACE FUNCTION prevent_price_manipulation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price_snapshot != OLD.price_snapshot THEN
    RAISE EXCEPTION 'price_snapshot não pode ser modificado após criação';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_cart_price_change
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_price_manipulation();
```

---

### 17. Falta validação de product_name_snapshot length

**Arquivo:** `20260404000007_add_cart_items_cross_field_constraints.sql`

**Problema:**
```sql
CHECK (product_name_snapshot != '' AND char_length(product_name_snapshot) > 0);
-- ❌ Não limita tamanho máximo
```

**Solução:**
```sql
ALTER TABLE cart_items
ADD CONSTRAINT check_product_name_length
CHECK (char_length(product_name_snapshot) > 0 AND char_length(product_name_snapshot) <= 255);
```

---

### 18. RLS policies não têm nome descritivo suficiente

**Arquivo:** `20260404000001_create_cart_items_table.sql`

**Problema:**
```sql
CREATE POLICY "cart_items_select_own"
-- ❌ Nome não indica que é para usuários autenticados
```

**Solução:**
```sql
CREATE POLICY "cart_items_authenticated_users_select_own"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### 19. Falta índice para query de produtos mais adicionados ao carrinho

**Arquivo:** `20260404000001_create_cart_items_table.sql`

**Problema:**
Query comum `SELECT product_id, COUNT(*) FROM cart_items GROUP BY product_id` não tem índice.

**Solução:**
```sql
CREATE INDEX idx_cart_items_product_count ON cart_items(product_id) 
  WHERE deleted_at IS NULL;
```

---

### 20. Falta validação de concorrência em add_to_cart_atomic

**Arquivo:** `20260404000006_create_add_to_cart_atomic_rpc.sql`

**Problema:**
```sql
ON CONFLICT (user_id, product_id, size)
DO UPDATE SET
  quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
-- ❌ Não valida se soma ultrapassa estoque
```

**Solução:**
```sql
ON CONFLICT (user_id, product_id, size)
DO UPDATE SET
  quantity = LEAST(
    cart_items.quantity + EXCLUDED.quantity, 
    99,
    (SELECT stock FROM products WHERE id = EXCLUDED.product_id)
  ),
  updated_at = NOW()
WHERE cart_items.quantity + EXCLUDED.quantity <= (SELECT stock FROM products WHERE id = EXCLUDED.product_id);
```

---

## 🟢 MELHORIAS RECOMENDADAS (Nice to have)

### 21. Adicionar soft delete em cart_items

**Motivo:** Permitir recuperação de itens removidos acidentalmente

**Solução:**
```sql
ALTER TABLE cart_items ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_cart_items_deleted_at ON cart_items(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Atualizar RLS policies
CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
```

---

### 22. Adicionar campo de origem em cart_items

**Motivo:** Rastrear se item veio de migration ou foi adicionado diretamente

**Solução:**
```sql
ALTER TABLE cart_items ADD COLUMN source TEXT DEFAULT 'direct' 
  CHECK (source IN ('direct', 'migration', 'import'));
```

---

### 23. Adicionar timestamp de última visualização

**Motivo:** Permitir cleanup de carrinhos abandonados

**Solução:**
```sql
ALTER TABLE cart_items ADD COLUMN last_viewed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX idx_cart_items_abandoned ON cart_items(last_viewed_at) 
  WHERE last_viewed_at < NOW() - INTERVAL '30 days';
```

---

### 24. Adicionar notificação de estoque baixo

**Motivo:** Alertar usuário quando produto está acabando

**Solução:**
```sql
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock < 10 AND OLD.stock >= 10 THEN
    PERFORM pg_notify('low_stock', json_build_object(
      'product_id', NEW.id,
      'stock', NEW.stock
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_product_low_stock
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();
```

---

### 25. Adicionar cache de contagem de wishlist

**Motivo:** Evitar COUNT(*) em cada INSERT

**Solução:**
```sql
ALTER TABLE auth.users ADD COLUMN wishlist_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_wishlist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE auth.users SET wishlist_count = wishlist_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE auth.users SET wishlist_count = wishlist_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_wishlist_count
  AFTER INSERT OR DELETE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_count();
```

---

### 26-35. Outras melhorias

26. Adicionar versionamento de price_snapshot
27. Adicionar histórico de alterações de quantidade
28. Adicionar tags/categorias em wishlist
29. Adicionar prioridade em wishlist
30. Adicionar compartilhamento de wishlist
31. Adicionar notificação de queda de preço
32. Adicionar limite de tempo para carrinho (expiração)
33. Adicionar desconto por quantidade
34. Adicionar gift wrapping option
35. Adicionar notas do cliente no item

---

## Priorização de Correções

### Sprint 1 (Crítico - Antes de Produção)
1. ✅ Corrigir RPC functions para usar auth.uid() (Issue #1)
2. ✅ Corrigir race condition em wishlist limit (Issue #2)
3. ✅ Adicionar validação de JSONB (Issue #3)
4. ✅ Adicionar validação de estoque (Issue #4)
5. ✅ Adicionar policy para service role (Issue #5)
6. ✅ Adicionar validação de NULL (Issue #6)
7. ✅ Validar constraints antes de inserir (Issue #7)
8. ✅ Validar tamanho de array (Issue #10)

### Sprint 2 (Importante - Antes de Escala)
9. ✅ Adicionar índices compostos (Issue #8)
10. ✅ Implementar cleanup de rate_limit_log (Issue #9)
11. ✅ Adicionar auditoria (Issue #12)
12. ✅ Validar formato de size (Issue #14)
13. ✅ Validar product_id em migrations (Issue #15)

### Sprint 3 (Melhorias - Incremental)
14. ✅ Prevenir manipulação de price (Issue #16)
15. ✅ Limitar tamanho de product_name (Issue #17)
16. ✅ Melhorar nomes de policies (Issue #18)
17. ✅ Adicionar soft delete (Melhoria #21)
18. ✅ Adicionar campo source (Melhoria #22)

---

## Checklist de Validação

Antes de aplicar correções:

- [ ] Criar backup do banco de dados
- [ ] Testar migrations em ambiente de desenvolvimento
- [ ] Executar testes de RLS com múltiplos usuários
- [ ] Validar performance com dados de teste (10k+ registros)
- [ ] Testar race conditions com requests concorrentes
- [ ] Validar que service role ainda funciona
- [ ] Executar suite de testes de segurança
- [ ] Revisar logs de erro após deploy

---

## Referências

- **Spec Original:** `.kiro/specs/supabase-security-validation/`
- **Migrations:** `supabase/migrations/`
- **Documentação:** `reference/engineering/supabase-security-implementation.md`
- **PostgreSQL Security:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security

---

## Contato

Para questões sobre correções:
1. Revisar este documento
2. Consultar spec original
3. Testar em ambiente de desenvolvimento primeiro
4. Aplicar correções incrementalmente
