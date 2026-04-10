# Products Query Timeout Fix - Bugfix Design

## Overview

A query `getProducts` está excedendo o timeout de 10 segundos no primeiro carregamento (cold start) da página inicial em produção, especificamente na seção "Equipamentos da Seleção". A estratégia de correção envolve múltiplas camadas: otimização de banco de dados (índices), otimização de query (seleção de campos), mitigação de cold start (prefetch server-side), resiliência no frontend (React Query retry), e observabilidade (logs diferenciados).

O objetivo é reduzir o tempo de resposta para < 2s no cold start e < 1s em requisições warm, garantindo que nenhuma funcionalidade existente (filtros, paginação, ordenação, full-text search) seja afetada.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug - quando a query `getProducts` é executada no primeiro carregamento (cold start) e excede 10 segundos
- **Property (P)**: O comportamento desejado - a query deve completar em < 2s no cold start e < 1s em requisições warm
- **Preservation**: Funcionalidades existentes que devem permanecer inalteradas - filtros (search, category, price, rating), paginação, ordenação, transformação de dados, full-text search em português, exclusão de soft-deleted
- **getProducts**: Função em `apps/web/src/modules/products/services/productService.ts` que busca produtos paginados com filtros
- **getProductsWithSearch**: Função auxiliar que executa full-text search em name e description usando `to_tsvector('portuguese')`
- **Cold Start**: Primeira requisição ao Supabase após período de inatividade, quando o banco precisa "aquecer"
- **Warm Request**: Requisições subsequentes quando o banco já está ativo e otimizado
- **Seq Scan**: Sequential Scan - varredura completa da tabela sem uso de índices (lento)
- **Index Scan**: Varredura usando índices (rápido)

## Bug Details

### Bug Condition

O bug se manifesta quando a página inicial é carregada pela primeira vez após período de inatividade (cold start do Supabase). A função `getProducts` executa uma query que varre a tabela `products` sem índices adequados, resultando em Sequential Scans lentos que excedem o timeout de 10 segundos.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { filters: ProductFilters, isColdStart: boolean, queryTime: number }
  OUTPUT: boolean
  
  RETURN input.isColdStart = true
         AND input.queryTime > 10000 (ms)
         AND queryExists('products', input.filters)
         AND NOT queryCompleted(input.queryTime)
END FUNCTION
```

### Examples

- **Cold Start Timeout**: Usuário acessa página inicial pela primeira vez → query `getProducts({ limit: 4, sortBy: 'latest' })` → timeout após 10s → erro "Erro ao carregar produtos"
- **Retry Success**: Usuário clica "Tentar Novamente" → query executa em < 1s → produtos exibidos (banco já aquecido)
- **Filtered Query Timeout**: Usuário busca "brasil" no cold start → query `getProducts({ search: 'brasil' })` → timeout após 10s → erro
- **Edge Case - Large Result Set**: Query sem LIMIT no cold start → pode exceder timeout mesmo com índices

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Filtros devem continuar funcionando: search (full-text), categoryId, minPrice, maxPrice, minRating
- Paginação deve continuar funcionando: page, limit, offset calculation
- Ordenação deve continuar funcionando: sortBy (latest, oldest, price_asc, price_desc)
- Transformação de dados deve continuar: snake_case → camelCase via `transformProductRow`
- Full-text search em português deve continuar: `to_tsvector('portuguese')` em name e description
- Soft-deleted products devem continuar excluídos: `deleted_at IS NULL`
- Erros do Supabase (não timeout) devem continuar lançando exceções apropriadas
- React Query caching deve continuar funcionando: cache independente por filtros

**Scope:**
Todas as queries que NÃO envolvem cold start devem ser completamente inalteradas. Isso inclui:
- Requisições warm (banco já ativo)
- Queries com cache hit no React Query
- Queries executadas após o primeiro carregamento bem-sucedido

## Hypothesized Root Cause

Baseado na descrição do bug e no plano de implementação fornecido, as causas mais prováveis são:

1. **Ausência de Índices no Banco**: A tabela `products` não possui índices em colunas frequentemente filtradas/ordenadas
   - `category_id` - usado em filtros de categoria
   - `price` - usado em filtros de faixa de preço e ordenação
   - `rating` - usado em filtros de avaliação mínima
   - `created_at` - usado em ordenação (latest/oldest)
   - `deleted_at` - usado em todas as queries (IS NULL)
   - Full-text search - sem índice GIN em `to_tsvector('portuguese', name || ' ' || description)`

2. **Query Ineficiente - SELECT ***: A query seleciona todas as colunas (`SELECT *`) mesmo quando apenas algumas são necessárias, aumentando o volume de dados transferidos

3. **Cold Start do Supabase**: Primeira requisição após inatividade requer "aquecimento" do banco, aumentando latência inicial

4. **Falta de LIMIT Enforcement**: Queries sem LIMIT explícito podem retornar grandes volumes de dados

5. **Timeout Muito Curto**: 10 segundos pode ser insuficiente para cold start mesmo com otimizações

6. **Ausência de Retry Automático**: Frontend não tenta novamente automaticamente, exigindo interação manual do usuário

## Correctness Properties

Property 1: Bug Condition - Query Performance on Cold Start

_For any_ query `getProducts` executada no primeiro carregamento (cold start) com filtros válidos e LIMIT definido, a função otimizada SHALL completar em menos de 2 segundos, retornando os produtos corretos sem timeout.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Functionality

_For any_ query `getProducts` executada com filtros (search, categoryId, minPrice, maxPrice, minRating), paginação (page, limit), ou ordenação (sortBy), o código otimizado SHALL produzir exatamente os mesmos resultados que o código original, preservando todas as funcionalidades de filtragem, paginação, ordenação, transformação de dados, full-text search em português, e exclusão de soft-deleted products.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File**: `supabase/migrations/20260408000001_optimize_products_query_performance.sql`

**Migration**: Criar índices para otimização de queries

**Specific Changes**:
1. **Índice em category_id**: `CREATE INDEX idx_products_category_id ON products(category_id) WHERE deleted_at IS NULL;`
   - Otimiza filtros por categoria
   - Conditional index exclui soft-deleted

2. **Índice em price**: `CREATE INDEX idx_products_price ON products(price) WHERE deleted_at IS NULL;`
   - Otimiza filtros de faixa de preço e ordenação por preço

3. **Índice em rating**: `CREATE INDEX idx_products_rating ON products(rating) WHERE deleted_at IS NULL;`
   - Otimiza filtros de avaliação mínima

4. **Índice em created_at**: `CREATE INDEX idx_products_created_at ON products(created_at DESC) WHERE deleted_at IS NULL;`
   - Otimiza ordenação por data (latest/oldest)
   - DESC para otimizar sortBy='latest' (caso mais comum)

5. **Índice em deleted_at**: `CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;`
   - Otimiza filtro universal `deleted_at IS NULL`

6. **Índice Full-Text Search**: `CREATE INDEX idx_products_fts ON products USING GIN (to_tsvector('portuguese', name || ' ' || description)) WHERE deleted_at IS NULL;`
   - Otimiza full-text search em português
   - GIN index para performance em text search

**File**: `apps/web/src/modules/products/services/productService.ts`

**Function**: `getProducts` e `getProductsWithSearch`

**Specific Changes**:
1. **Remover SELECT ***: Substituir por seleção explícita de campos necessários
   - `select('id, name, description, price, category_id, image_url, stock, features, rating, reviews, created_at, updated_at, deleted_at, category:categories(id, name, slug, description, created_at, updated_at)')`
   - Reduz volume de dados transferidos

2. **Garantir LIMIT**: Adicionar LIMIT padrão se não fornecido
   - `const effectiveLimit = Math.min(limit || 20, 100);` (máximo 100)
   - Previne queries sem limite

3. **Aumentar Timeout**: Ajustar de 10s para 15s
   - `setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)`
   - Acomoda cold start mesmo com otimizações

4. **Implementar Retry**: Adicionar retry automático no catch do timeout
   - Tentar novamente 1x antes de lançar erro
   - Apenas para timeouts, não para erros do Supabase

5. **Adicionar Logs Diferenciados**: Distinguir cold start vs warm
   - `console.log('[getProducts] Cold start detected, query may take longer')`
   - `console.log('[getProducts] Query completed in ${duration}ms')`
   - Facilita diagnóstico em produção

**File**: `apps/web/src/modules/products/hooks/useProducts.ts`

**Hook**: `useProducts`

**Specific Changes**:
1. **Configurar React Query Retry**: Adicionar retry com exponential backoff
   - `retry: 2` - tenta até 2x em caso de erro
   - `retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)` - backoff exponencial

2. **Configurar staleTime**: Manter dados "frescos" por mais tempo
   - `staleTime: 5 * 60 * 1000` (5 minutos) - reduz refetches desnecessários

3. **Configurar keepPreviousData**: Manter dados anteriores durante refetch
   - `keepPreviousData: true` - evita loading states em paginação

**File**: `apps/web/src/app/page.tsx` (OPTION A - Preferida)

**Component**: `Home` (Server Component)

**Specific Changes**:
1. **Implementar Prefetch Server-Side**: Buscar produtos no servidor antes de renderizar
   - Converter para Server Component ou usar `getServerSideProps`
   - Executar `getProducts({ limit: 4, sortBy: 'latest' })` no servidor
   - Passar dados como props para componente cliente
   - Elimina cold start no cliente (servidor aquece o banco)

## Testing Strategy

### Validation Approach

A estratégia de testes segue abordagem de duas fases: primeiro, surfacear contraexemplos que demonstram o bug no código não corrigido, depois verificar que a correção funciona corretamente e preserva comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Surfacear contraexemplos que demonstram o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotetisar.

**Test Plan**: Escrever testes que simulam cold start e medem tempo de query. Executar no código NÃO CORRIGIDO para observar falhas e entender a causa raiz. Usar `EXPLAIN ANALYZE` no Supabase para identificar Seq Scans.

**Test Cases**:
1. **Cold Start Timeout Test**: Simular cold start → executar `getProducts({ limit: 4, sortBy: 'latest' })` → medir tempo → ASSERT tempo > 10s (falhará no código não corrigido)
2. **EXPLAIN ANALYZE Test**: Executar `EXPLAIN ANALYZE SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 4` → ASSERT contém "Seq Scan" (confirmará ausência de índices)
3. **Filtered Query Timeout**: Simular cold start → executar `getProducts({ search: 'brasil' })` → medir tempo → ASSERT tempo > 10s (falhará no código não corrigido)
4. **Large Result Set Test**: Executar `getProducts({})` sem LIMIT → medir tempo → pode exceder timeout (edge case)

**Expected Counterexamples**:
- Queries excedem 10s no cold start
- `EXPLAIN ANALYZE` mostra Sequential Scans ao invés de Index Scans
- Possíveis causas: ausência de índices, SELECT *, cold start do Supabase

### Fix Checking

**Goal**: Verificar que para todas as queries onde a condição de bug se aplica (cold start), a função corrigida produz o comportamento esperado (< 2s).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := getProducts_fixed(input.filters)
  ASSERT result.queryTime < 2000 (ms)
  ASSERT result.products.length > 0
  ASSERT result.error = null
END FOR
```

**Test Plan**: Após aplicar índices e otimizações, executar testes de cold start e verificar que queries completam em < 2s.

**Test Cases**:
1. **Cold Start Performance Test**: Simular cold start → executar `getProducts({ limit: 4, sortBy: 'latest' })` → ASSERT tempo < 2s
2. **Warm Request Performance Test**: Executar query 2x → ASSERT segunda execução < 1s
3. **EXPLAIN ANALYZE Verification**: Executar `EXPLAIN ANALYZE` → ASSERT contém "Index Scan" (não "Seq Scan")
4. **Filtered Query Performance**: Simular cold start → executar `getProducts({ search: 'brasil' })` → ASSERT tempo < 2s

### Preservation Checking

**Goal**: Verificar que para todas as queries onde a condição de bug NÃO se aplica (requisições warm, queries com cache), a função corrigida produz exatamente o mesmo resultado que a função original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT getProducts_original(input) = getProducts_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que comportamento permanece inalterado para todas as queries não afetadas pelo bug

**Test Plan**: Observar comportamento no código NÃO CORRIGIDO primeiro para queries com filtros, paginação, ordenação, depois escrever property-based tests capturando esse comportamento.

**Test Cases**:
1. **Filter Preservation**: Observar que filtros (search, categoryId, minPrice, maxPrice, minRating) funcionam corretamente no código não corrigido, depois escrever teste para verificar que continuam após correção
2. **Pagination Preservation**: Observar que paginação (page, limit, offset) funciona corretamente no código não corrigido, depois escrever teste para verificar que continua após correção
3. **Sorting Preservation**: Observar que ordenação (latest, oldest, price_asc, price_desc) funciona corretamente no código não corrigido, depois escrever teste para verificar que continua após correção
4. **Data Transformation Preservation**: Observar que transformação snake_case → camelCase funciona corretamente no código não corrigido, depois escrever teste para verificar que continua após correção
5. **Full-Text Search Preservation**: Observar que full-text search em português funciona corretamente no código não corrigido, depois escrever teste para verificar que continua após correção
6. **Soft-Delete Preservation**: Observar que produtos soft-deleted são excluídos corretamente no código não corrigado, depois escrever teste para verificar que continua após correção

### Unit Tests

- Testar criação de índices: verificar que índices existem após migration
- Testar seleção de campos: verificar que SELECT não usa * (apenas campos necessários)
- Testar LIMIT enforcement: verificar que queries sem LIMIT recebem LIMIT padrão
- Testar timeout aumentado: verificar que timeout é 15s (não 10s)
- Testar retry automático: verificar que timeout dispara retry antes de falhar
- Testar logs diferenciados: verificar que logs incluem tempo de query e indicador de cold start

### Property-Based Tests

- Gerar filtros aleatórios (search, categoryId, minPrice, maxPrice, minRating) e verificar que resultados são consistentes entre código original e corrigido
- Gerar configurações de paginação aleatórias (page, limit) e verificar que resultados são consistentes
- Gerar configurações de ordenação aleatórias (sortBy) e verificar que ordem é preservada
- Testar que queries com muitos cenários diferentes completam em < 2s no cold start

### Integration Tests

- Testar fluxo completo: cold start → página inicial carrega → produtos exibidos em < 2s
- Testar fluxo de retry: cold start com timeout → retry automático → produtos exibidos
- Testar fluxo de filtros: aplicar filtros → produtos filtrados exibidos corretamente
- Testar fluxo de paginação: navegar entre páginas → produtos paginados exibidos corretamente
- Testar feedback visual: loading state → produtos exibidos (sem erro "Tentar Novamente")
