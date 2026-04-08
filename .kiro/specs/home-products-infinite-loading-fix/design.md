# Home Products Infinite Loading Bugfix Design

## Overview

A página inicial (`apps/web/src/app/page.tsx`) apresenta loading infinito ao tentar carregar produtos usando `useProducts({ limit: 4, sortBy: 'latest' })`. A query do React Query nunca resolve nem rejeita, deixando o componente em estado `isLoading: true` indefinidamente. Outras páginas que usam o mesmo hook funcionam normalmente, indicando que o problema está isolado à configuração específica da home page ou à falta de tratamento de erros/timeouts no React Query.

A estratégia de fix envolve:
1. Adicionar timeout explícito no React Query para evitar queries travadas indefinidamente
2. Verificar e corrigir RLS policies na tabela `products` para permitir acesso anônimo (leitura pública)
3. Adicionar error boundary e logging para capturar falhas silenciosas
4. Validar variáveis de ambiente em produção

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug - quando a query `useProducts({ limit: 4, sortBy: 'latest' })` é executada na home page e nunca resolve
- **Property (P)**: O comportamento desejado - a query deve resolver com dados ou rejeitar com erro tratável em até 10 segundos
- **Preservation**: Outras páginas que usam `useProducts` ou `useProduct` devem continuar funcionando normalmente
- **useProducts**: Hook do React Query em `apps/web/src/modules/products/hooks/useProducts.ts` que busca produtos paginados
- **getProducts**: Função service em `apps/web/src/modules/products/services/productService.ts` que executa a query no Supabase
- **QueryProvider**: Provider do React Query em `apps/web/src/lib/react-query/QueryProvider.tsx` que configura cache e retry
- **RLS (Row Level Security)**: Sistema de segurança do Supabase que controla acesso a linhas de tabelas baseado em políticas

## Bug Details

### Bug Condition

O bug se manifesta quando a home page tenta carregar produtos usando `useProducts({ limit: 4, sortBy: 'latest' })`. A query do React Query é executada, mas a promise retornada por `getProducts()` nunca resolve nem rejeita, causando timeout silencioso sem captura de erro.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { page: string, filters: ProductFilters }
  OUTPUT: boolean
  
  RETURN input.page == '/' (home page)
         AND input.filters == { limit: 4, sortBy: 'latest' }
         AND queryState.isLoading == true
         AND queryState.data == undefined
         AND queryState.error == undefined
         AND elapsedTime > 10 seconds
END FUNCTION
```

### Examples

- **Exemplo 1**: Usuário acessa `http://localhost:3000/` → Loading spinner gira indefinidamente, produtos nunca aparecem
- **Exemplo 2**: Usuário acessa `http://localhost:3000/products` → Produtos carregam normalmente (mesma query, página diferente)
- **Exemplo 3**: Usuário acessa produto individual `/products/[id]` → Produto carrega normalmente usando `useProduct(id)`
- **Edge Case**: Usuário acessa home page com cache válido do React Query → Produtos aparecem instantaneamente (cache hit), mas ao expirar o cache (5 minutos), volta ao loading infinito

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Outras páginas que usam `useProducts` (catálogo completo `/products`) devem continuar carregando produtos normalmente
- Página de produto individual `/products/[id]` usando `useProduct(id)` deve continuar funcionando
- Carrinho e wishlist que persistem dados no Supabase devem continuar operando normalmente
- Cache do React Query (staleTime: 5 minutos) deve continuar funcionando para evitar requisições desnecessárias
- Transformação de dados usando `transformProductRow()` deve continuar funcionando corretamente

**Scope:**
Todas as queries que NÃO são `useProducts({ limit: 4, sortBy: 'latest' })` na home page devem ser completamente não afetadas pelo fix. Isso inclui:
- Queries com filtros diferentes (search, categoryId, price range)
- Queries em outras páginas (catálogo, produto individual)
- Mutations (adicionar ao carrinho, wishlist)

## Hypothesized Root Cause

Baseado na análise do código e nas informações fornecidas, as causas raiz mais prováveis são:

1. **RLS Policy Ausente na Tabela Products**: A tabela `products` não tem RLS habilitado nem policies configuradas. Se o Supabase estiver bloqueando acesso anônimo por padrão, a query falhará silenciosamente sem retornar erro explícito. Outras tabelas (`cart_items`, `wishlist_items`, `orders`) têm RLS configurado, mas `products` não aparece em nenhuma migration.

2. **React Query Sem Timeout**: O `QueryProvider` configura `retry: 1` mas não define `timeout` ou `networkMode`. Se a requisição HTTP travar (ex: DNS não resolve, conexão TCP não completa), o React Query aguardará indefinidamente sem rejeitar a promise.

3. **Variáveis de Ambiente Incorretas em Produção**: As env vars `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem estar incorretas ou ausentes em produção, causando falha na inicialização do cliente Supabase. O singleton em `createClient()` pode estar retornando um cliente mal configurado.

4. **Erro Silencioso Não Capturado**: A função `getProducts()` usa `throw new Error()` para propagar erros, mas se o Supabase retornar `{ data: null, error: null }` (timeout silencioso), a função não lançará exceção e o React Query ficará aguardando indefinidamente.

## Correctness Properties

Property 1: Bug Condition - Query Resolution with Timeout

_For any_ query execution where `useProducts({ limit: 4, sortBy: 'latest' })` is called on the home page, the fixed implementation SHALL either resolve with product data or reject with a catchable error within 10 seconds, preventing infinite loading states.

**Validates: Requirements 2.1, 2.2, 2.4**

Property 2: Preservation - Other Pages Functionality

_For any_ query execution that is NOT `useProducts({ limit: 4, sortBy: 'latest' })` on the home page (including catalog page, individual product pages, cart, wishlist), the fixed implementation SHALL produce exactly the same behavior as the original code, preserving all existing functionality for other routes and query configurations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File 1**: `supabase/migrations/20260407000001_enable_products_public_access.sql` (NEW)

**Purpose**: Habilitar acesso público de leitura na tabela `products` para usuários anônimos

**Specific Changes**:
1. **Enable RLS on products table**: Adicionar `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`
2. **Create public read policy**: Criar policy `products_select_public` que permite `SELECT` para todos (autenticados e anônimos) onde `deleted_at IS NULL`
3. **Preserve admin write access**: Garantir que apenas admins possam `INSERT`, `UPDATE`, `DELETE` (policies futuras)

**SQL**:
```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to non-deleted products
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (deleted_at IS NULL);

-- Note: INSERT/UPDATE/DELETE policies should be added later for admin-only access
```

**File 2**: `apps/web/src/lib/react-query/QueryProvider.tsx`

**Function**: `QueryProvider` component

**Specific Changes**:
1. **Add query timeout**: Adicionar `timeout: 10000` (10 segundos) nas `defaultOptions.queries`
2. **Add network mode**: Adicionar `networkMode: 'offlineFirst'` para melhor handling de falhas de rede
3. **Add error retry delay**: Adicionar `retryDelay: 1000` para evitar retry imediato

**Before**:
```typescript
defaultOptions: {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
}
```

**After**:
```typescript
defaultOptions: {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst',
    // CRITICAL: Add timeout to prevent infinite loading
    meta: {
      timeout: 10000, // 10 seconds
    },
  },
}
```

**File 3**: `apps/web/src/modules/products/services/productService.ts`

**Function**: `getProducts` and `getProductsWithSearch`

**Specific Changes**:
1. **Add explicit error handling**: Verificar se `data` é `null` mesmo quando `error` é `null` (timeout silencioso)
2. **Add timeout wrapper**: Envolver a query do Supabase com `Promise.race()` para forçar timeout
3. **Add detailed error logging**: Adicionar `console.error()` com contexto completo para debugging

**Before** (linha ~70):
```typescript
const { data, error, count } = await query;

if (error) {
  throw new Error(`Failed to fetch products: ${error.message}`);
}
```

**After**:
```typescript
// Wrap query with timeout to prevent infinite loading
const queryPromise = query;
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
);

let data, error, count;
try {
  const result = await Promise.race([queryPromise, timeoutPromise]);
  data = result.data;
  error = result.error;
  count = result.count;
} catch (timeoutError) {
  console.error('[getProducts] Query timeout:', {
    filters,
    error: timeoutError,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  throw timeoutError;
}

if (error) {
  console.error('[getProducts] Supabase error:', {
    filters,
    error: error.message,
    code: error.code,
  });
  throw new Error(`Failed to fetch products: ${error.message}`);
}

// CRITICAL: Check for silent failure (data is null but no error)
if (!data) {
  console.error('[getProducts] Silent failure: data is null but no error', { filters });
  throw new Error('Failed to fetch products: No data returned');
}
```

**File 4**: `apps/web/src/app/page.tsx`

**Component**: `Home`

**Specific Changes**:
1. **Add error state display**: Exibir mensagem de erro amigável quando `error` não é `undefined`
2. **Add retry button**: Permitir que usuário tente recarregar manualmente
3. **Add error logging**: Log erro no console para debugging

**Before** (linha ~40):
```typescript
{isLoadingProducts ? (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
) : (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
    {productsData?.products.slice(0, 4).map((product) => (
      <ProductCard 
        key={product.id} 
        id={product.id}
        image={product.imageUrl}
        title={product.name}
        price={product.price}
        category={product.categoryId}
      />
    ))}
  </div>
)}
```

**After**:
```typescript
{isLoadingProducts ? (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
) : error ? (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <p className="text-destructive text-lg">Erro ao carregar produtos</p>
    <p className="text-muted-foreground text-sm">{error.message}</p>
    <button 
      onClick={() => window.location.reload()}
      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
    >
      Tentar Novamente
    </button>
  </div>
) : (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
    {productsData?.products.slice(0, 4).map((product) => (
      <ProductCard 
        key={product.id} 
        id={product.id}
        image={product.imageUrl}
        title={product.name}
        price={product.price}
        category={product.categoryId}
      />
    ))}
  </div>
)}
```

**File 5**: `apps/web/src/app/page.tsx` (destructure error)

**Line**: ~35

**Change**: Adicionar `error` no destructuring do `useProducts`

**Before**:
```typescript
const { data: productsData, isLoading: isLoadingProducts } = useProducts({ 
  limit: 4,
  sortBy: 'latest'
});
```

**After**:
```typescript
const { data: productsData, isLoading: isLoadingProducts, error } = useProducts({ 
  limit: 4,
  sortBy: 'latest'
});
```

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de duas fases: primeiro, surfacear contraexemplos que demonstram o bug no código não corrigido, depois verificar que o fix funciona corretamente e preserva comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Surfacear contraexemplos que demonstram o bug ANTES de implementar o fix. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotetisar.

**Test Plan**: Escrever testes que simulam a query `useProducts({ limit: 4, sortBy: 'latest' })` na home page e verificam se a promise resolve ou rejeita em até 10 segundos. Executar esses testes no código NÃO CORRIGIDO para observar falhas e entender a causa raiz.

**Test Cases**:
1. **Home Page Query Timeout Test**: Simular acesso à home page e verificar se a query resolve em até 10 segundos (falhará no código não corrigido - timeout infinito)
2. **RLS Policy Test**: Tentar acessar `products` table como usuário anônimo via Supabase client e verificar se retorna dados ou erro explícito (pode falhar se RLS bloquear acesso)
3. **Silent Failure Test**: Verificar se `getProducts()` retorna `{ data: null, error: null }` em cenários de timeout (falhará no código não corrigido - não há tratamento)
4. **Environment Variables Test**: Verificar se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão definidas e válidas (pode falhar em produção)

**Expected Counterexamples**:
- Query trava indefinidamente sem resolver nem rejeitar
- Possíveis causas: RLS bloqueando acesso anônimo, timeout não configurado, env vars incorretas, erro silencioso não capturado

### Fix Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug se aplica, a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := useProducts_fixed({ limit: 4, sortBy: 'latest' })
  ASSERT (result.data !== undefined OR result.error !== undefined) 
         AND elapsedTime <= 10 seconds
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug NÃO se aplica, a função corrigida produz o mesmo resultado que a função original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT useProducts_original(input) = useProducts_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento não mudou para todas as entradas não-buggy

**Test Plan**: Observar comportamento no código NÃO CORRIGIDO primeiro para outras páginas e queries, depois escrever testes baseados em propriedades capturando esse comportamento.

**Test Cases**:
1. **Catalog Page Preservation**: Observar que `/products` carrega produtos corretamente no código não corrigido, depois verificar que continua funcionando após fix
2. **Individual Product Preservation**: Observar que `/products/[id]` carrega produto individual corretamente, depois verificar que continua funcionando
3. **Cart/Wishlist Preservation**: Observar que adicionar ao carrinho/wishlist funciona corretamente, depois verificar que continua funcionando
4. **Cache Preservation**: Observar que cache do React Query (staleTime: 5 minutos) funciona corretamente, depois verificar que continua funcionando

### Unit Tests

- Testar `getProducts()` com timeout simulado (mock Supabase para nunca resolver)
- Testar `getProducts()` com RLS bloqueando acesso (mock Supabase para retornar erro de permissão)
- Testar `getProducts()` com silent failure (mock Supabase para retornar `{ data: null, error: null }`)
- Testar `useProducts()` com diferentes filtros e verificar que todos resolvem em até 10 segundos

### Property-Based Tests

- Gerar queries aleatórias com diferentes filtros (search, categoryId, price range, sort, pagination) e verificar que todas resolvem ou rejeitam em até 10 segundos
- Gerar estados aleatórios do React Query (cache hit, cache miss, stale data) e verificar que comportamento é preservado
- Testar que todas as queries em páginas diferentes da home continuam funcionando corretamente

### Integration Tests

- Testar fluxo completo: acessar home page → aguardar produtos carregarem → verificar que 4 produtos aparecem em até 10 segundos
- Testar fluxo de erro: simular falha de conexão → verificar que mensagem de erro aparece → clicar em "Tentar Novamente" → verificar que produtos carregam
- Testar fluxo de cache: acessar home page → aguardar produtos carregarem → navegar para outra página → voltar para home → verificar que produtos aparecem instantaneamente (cache hit)
