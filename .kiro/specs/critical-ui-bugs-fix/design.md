# Critical UI Bugs Fix - Design Document

## Overview

Este documento detalha a solução técnica para corrigir 4 bugs críticos que impedem funcionalidades essenciais de e-commerce na aplicação Agon:

1. **Bug de Redirecionamento**: Botão "Juntar-se à Elite" redireciona usuários autenticados para página de cadastro
2. **Bug de Carrinho**: Função RPC `add_to_cart_atomic` pode não existir ou falhar silenciosamente
3. **Bug de Histórico**: Loading infinito ao carregar histórico de pedidos
4. **Bug de Endereço**: Loading infinito ao salvar novo endereço

A estratégia de correção foca em:
- Adicionar verificação de autenticação antes do redirecionamento
- Implementar tratamento de erro robusto para chamadas RPC
- Adicionar timeout e error handling para queries assíncronas
- Melhorar feedback visual e mensagens de erro ao usuário

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug - quando uma operação assíncrona falha ou não retorna
- **Property (P)**: O comportamento desejado - operações devem completar com sucesso ou falhar com mensagem clara
- **Preservation**: Comportamentos existentes que devem permanecer inalterados pela correção
- **RPC (Remote Procedure Call)**: Função executada no banco de dados Supabase
- **RLS (Row Level Security)**: Políticas de segurança do Supabase que controlam acesso a dados
- **Optimistic Update**: Atualização imediata da UI antes da confirmação do servidor
- **useAuth**: Hook customizado que retorna o estado de autenticação do usuário via Supabase
- **createClient**: Função singleton que retorna instância do cliente Supabase

## Bug Details

### Bug 1: Redirecionamento Incorreto do Botão "Juntar-se à Elite"

O botão "Juntar-se à Elite" na página inicial (`apps/web/src/app/page.tsx`) sempre redireciona para `/cadastro`, independente do estado de autenticação do usuário.

**Formal Specification:**
```
FUNCTION isBugCondition1(input)
  INPUT: input of type { userAuthState: boolean, clickTarget: string }
  OUTPUT: boolean
  
  RETURN input.clickTarget == "Juntar-se à Elite"
         AND input.userAuthState == true
         AND redirectTarget == "/cadastro"
END FUNCTION
```

### Examples

- **Exemplo 1**: Usuário logado clica em "Juntar-se à Elite" → Redireciona para `/cadastro` (incorreto, deveria ir para `/perfil` ou `/products`)
- **Exemplo 2**: Usuário não logado clica em "Juntar-se à Elite" → Redireciona para `/cadastro` (correto)
- **Exemplo 3**: Usuário logado já está em `/cadastro` → Sistema permite acesso (incorreto, deveria redirecionar)

### Bug 2: Falha Silenciosa ao Adicionar ao Carrinho

A função `add_to_cart_atomic` pode não existir no banco de dados ou falhar por erro de execução, mas o sistema não exibe mensagem de erro clara ao usuário.

**Formal Specification:**
```
FUNCTION isBugCondition2(input)
  INPUT: input of type { rpcName: string, rpcExists: boolean, rpcError: Error | null }
  OUTPUT: boolean
  
  RETURN input.rpcName == "add_to_cart_atomic"
         AND (input.rpcExists == false OR input.rpcError != null)
         AND userFeedback == null
END FUNCTION
```

### Examples

- **Exemplo 1**: RPC não existe no banco → Toast genérico "Erro ao adicionar ao carrinho" (não específico)
- **Exemplo 2**: RPC retorna `{success: false, error: "Produto não encontrado"}` → Erro não é exibido ao usuário
- **Exemplo 3**: RPC falha por timeout → Retry não acontece, usuário não sabe o que fazer

### Bug 3: Loading Infinito no Histórico de Pedidos

O componente `OrderHistoryViewer` não trata corretamente falhas na query do Supabase, deixando `isLoading` como `true` indefinidamente.

**Formal Specification:**
```
FUNCTION isBugCondition3(input)
  INPUT: input of type { queryState: string, errorOccurred: boolean, loadingState: boolean }
  OUTPUT: boolean
  
  RETURN input.queryState == "failed"
         AND input.errorOccurred == true
         AND input.loadingState == true
         AND timeElapsed > 5000ms
END FUNCTION
```

### Examples

- **Exemplo 1**: Query falha por RLS → `isLoading` permanece `true`, usuário vê "Buscando seu histórico..." indefinidamente
- **Exemplo 2**: Query falha por timeout de rede → Sem retry, sem mensagem de erro
- **Exemplo 3**: Usuário sem pedidos → Query retorna array vazio, mas UI não exibe estado vazio apropriado

### Bug 4: Loading Infinito ao Adicionar Endereço

O componente `AddressManager` não trata corretamente falhas no insert de endereço, deixando `isSubmitting` como `true` indefinidamente.

**Formal Specification:**
```
FUNCTION isBugCondition4(input)
  INPUT: input of type { insertState: string, errorOccurred: boolean, submittingState: boolean }
  OUTPUT: boolean
  
  RETURN input.insertState == "failed"
         AND input.errorOccurred == true
         AND input.submittingState == true
         AND timeElapsed > 5000ms
END FUNCTION
```

### Examples

- **Exemplo 1**: Insert falha por RLS (usuário não autenticado) → Botão fica em loading indefinidamente
- **Exemplo 2**: Insert falha por constraint (limite de 5 endereços) → Erro não é exibido claramente
- **Exemplo 3**: Insert falha por timeout de rede → Sem retry, botão travado

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Operações de carrinho (update, remove, clear) devem continuar funcionando com optimistic updates
- Edição e exclusão de endereços devem continuar funcionando normalmente
- Visualização de detalhes de pedidos deve continuar funcionando
- Autenticação e logout devem continuar funcionando normalmente
- Navegação para outras páginas deve continuar funcionando

**Scope:**
Todas as operações que NÃO envolvem os 4 bugs específicos devem permanecer completamente inalteradas. Isso inclui:
- Operações de wishlist
- Operações de checkout
- Operações de perfil (edição de dados pessoais)
- Operações de produtos (listagem, busca, filtros)

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

### Bug 1: Falta de Verificação de Autenticação

1. **Link Estático**: O botão usa `<Link href="/cadastro">` sem verificar estado de autenticação
   - Solução: Usar `useAuth()` hook e renderizar href condicional
   - Alternativa: Usar `onClick` handler com verificação de auth

### Bug 2: Tratamento de Erro Insuficiente na RPC

1. **Erro Genérico**: O catch block em `cartService.addToCart` não diferencia tipos de erro
   - RPC não existe → Erro PostgreSQL específico
   - RPC retorna `{success: false}` → Erro de negócio
   - Timeout de rede → Erro de conexão

2. **Falta de Validação**: Não verifica se RPC existe antes de chamar
   - Solução: Adicionar fallback para insert direto se RPC falhar

### Bug 3: Finally Block Ausente

1. **Estado de Loading Não Resetado**: O `setIsLoading(false)` está apenas no try block
   - Se erro ocorre, finally não executa
   - Solução: Mover `setIsLoading(false)` para finally block

2. **Falta de Timeout**: Query pode ficar pendente indefinidamente
   - Solução: Adicionar timeout de 10 segundos com AbortController

### Bug 4: Finally Block Ausente

1. **Estado de Submitting Não Resetado**: O `setIsSubmitting(false)` está apenas no try block
   - Se erro ocorre, finally não executa
   - Solução: Mover `setIsSubmitting(false)` para finally block

2. **Falta de Timeout**: Insert pode ficar pendente indefinidamente
   - Solução: Adicionar timeout de 10 segundos com AbortController

## Correctness Properties

Property 1: Bug Condition - Redirecionamento Baseado em Autenticação

_For any_ click event on "Juntar-se à Elite" button where the user is authenticated (useAuth returns user object), the fixed component SHALL redirect to `/perfil` or `/products` instead of `/cadastro`, providing appropriate navigation for logged-in users.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Tratamento de Erro RPC

_For any_ call to `add_to_cart_atomic` RPC that fails (RPC doesn't exist, returns error, or times out), the fixed service SHALL display a specific error message to the user explaining what went wrong and suggesting next steps.

**Validates: Requirements 2.3, 2.4, 2.5**

Property 3: Bug Condition - Carregamento de Histórico com Timeout

_For any_ query to fetch order history that fails or takes longer than 10 seconds, the fixed component SHALL stop loading state and display an appropriate error message or empty state, preventing infinite loading.

**Validates: Requirements 2.6, 2.7, 2.8**

Property 4: Bug Condition - Salvamento de Endereço com Timeout

_For any_ insert operation to save address that fails or takes longer than 10 seconds, the fixed component SHALL stop submitting state and display a specific error message, allowing the user to retry.

**Validates: Requirements 2.9, 2.10, 2.11**

Property 5: Preservation - Operações de Carrinho Existentes

_For any_ cart operation that is NOT "add to cart" (update quantity, remove item, clear cart), the fixed code SHALL produce exactly the same behavior as the original code, preserving optimistic updates and rollback logic.

**Validates: Requirements 3.3, 3.4, 3.5**

Property 6: Preservation - Operações de Endereço Existentes

_For any_ address operation that is NOT "create address" (edit, delete, set default), the fixed code SHALL produce exactly the same behavior as the original code, preserving optimistic updates and rollback logic.

**Validates: Requirements 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

#### Bug 1: Redirecionamento Inteligente

**File**: `apps/web/src/app/page.tsx`

**Function**: Component render (botão "Juntar-se à Elite")

**Specific Changes**:
1. **Adicionar useAuth Hook**: Importar e usar `useAuth()` para obter estado de autenticação
   ```typescript
   import { useAuth } from '@/hooks/useAuth';
   const { user } = useAuth();
   ```

2. **Renderização Condicional do Link**: Alterar href baseado em autenticação
   ```typescript
   <Link 
     href={user ? "/perfil" : "/cadastro"}
     className="..."
   >
     Junte-se à Elite
   </Link>
   ```

3. **Alternativa com onClick**: Se preferir controle mais fino
   ```typescript
   const handleJoinElite = () => {
     if (user) {
       router.push('/perfil');
     } else {
       router.push('/cadastro');
     }
   };
   ```

#### Bug 2: Tratamento Robusto de Erro RPC

**File**: `apps/web/src/modules/cart/services/cartService.ts`

**Function**: `addToCart`

**Specific Changes**:
1. **Detectar Erro de RPC Não Existente**: Verificar código de erro PostgreSQL
   ```typescript
   if (error) {
     if (error.code === '42883') { // function does not exist
       toast.error('Função de carrinho não configurada. Contate o suporte.');
     } else if (error.message?.includes('timeout')) {
       toast.error('Tempo esgotado. Tente novamente.');
     } else {
       toast.error(`Erro ao adicionar: ${error.message}`);
     }
     throw error;
   }
   ```

2. **Verificar Resposta de Sucesso**: Validar estrutura da resposta RPC
   ```typescript
   if (!data.success) {
     const errorMsg = data.error || 'Erro desconhecido';
     toast.error(errorMsg);
     throw new Error(errorMsg);
   }
   ```

3. **Fallback para Insert Direto**: Se RPC falhar, tentar insert manual
   ```typescript
   } catch (rpcError) {
     // Fallback: try direct insert
     const { data, error } = await supabase
       .from('cart_items')
       .insert({...})
       .select()
       .single();
     
     if (error) throw error;
     return transformCartItemRow(data);
   }
   ```

#### Bug 3: Timeout e Finally Block para Histórico

**File**: `apps/web/src/components/profile/OrderHistoryViewer.tsx`

**Function**: `fetchOrders`

**Specific Changes**:
1. **Adicionar AbortController**: Implementar timeout de 10 segundos
   ```typescript
   const fetchOrders = async () => {
     const abortController = new AbortController();
     const timeoutId = setTimeout(() => abortController.abort(), 10000);
     
     try {
       setIsLoading(true);
       
       const { data, error } = await supabase
         .from("orders")
         .select("...")
         .abortSignal(abortController.signal);
       
       clearTimeout(timeoutId);
       
       if (error) throw error;
       setOrders(transformedOrders);
     } catch (error) {
       if (error.name === 'AbortError') {
         toast.error('Tempo esgotado ao carregar pedidos. Tente novamente.');
       } else {
         toast.error('Erro ao carregar histórico de pedidos');
       }
       console.error(error);
     } finally {
       setIsLoading(false); // CRITICAL: Always reset loading
     }
   };
   ```

2. **Melhorar Mensagens de Erro**: Diferenciar tipos de erro
   ```typescript
   } catch (error: any) {
     if (error.name === 'AbortError') {
       toast.error('Tempo esgotado. Tente novamente.');
     } else if (error.code === 'PGRST116') { // RLS error
       toast.error('Sem permissão para acessar pedidos');
     } else {
       toast.error('Erro ao carregar histórico');
     }
   }
   ```

#### Bug 4: Timeout e Finally Block para Endereço

**File**: `apps/web/src/components/profile/AddressManager.tsx`

**Function**: `handleCreate`

**Specific Changes**:
1. **Adicionar AbortController**: Implementar timeout de 10 segundos
   ```typescript
   const handleCreate = async (data: AddressFormValues) => {
     const abortController = new AbortController();
     const timeoutId = setTimeout(() => abortController.abort(), 10000);
     
     try {
       setIsSubmitting(true);
       
       const { data: newAddress, error } = await supabase
         .from("addresses")
         .insert({...})
         .abortSignal(abortController.signal)
         .select()
         .single();
       
       clearTimeout(timeoutId);
       
       if (error) throw error;
       
       toast.success("Endereço adicionado com sucesso!");
       setIsFormOpen(false);
     } catch (error: any) {
       if (error.name === 'AbortError') {
         toast.error('Tempo esgotado ao salvar endereço. Tente novamente.');
       } else if (error.code === '23505') { // unique constraint
         toast.error('Você já possui um endereço padrão');
       } else if (error.code === 'PGRST116') { // RLS error
         toast.error('Sem permissão para adicionar endereço. Faça login novamente.');
       } else {
         toast.error('Erro ao adicionar endereço');
       }
       console.error(error);
     } finally {
       setIsSubmitting(false); // CRITICAL: Always reset submitting
     }
   };
   ```

2. **Aplicar Mesmo Fix em handleUpdate**: Garantir consistência
   ```typescript
   const handleUpdate = async (data: AddressFormValues) => {
     // Same timeout and finally logic
   };
   ```

## Testing Strategy

### Validation Approach

A estratégia de teste segue uma abordagem de duas fases: primeiro, reproduzir os bugs no código não corrigido para confirmar a análise de causa raiz, depois verificar que as correções funcionam e preservam comportamentos existentes.

### Exploratory Bug Condition Checking

**Goal**: Reproduzir os bugs ANTES de implementar as correções. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: Escrever testes que simulam as condições de bug e executá-los no código NÃO CORRIGIDO para observar falhas.

**Test Cases**:
1. **Bug 1 - Redirect Test**: Simular usuário autenticado clicando em "Juntar-se à Elite" (falhará no código não corrigido)
   - Mock `useAuth()` retornando `{ user: { id: 'test-user' } }`
   - Renderizar página inicial
   - Clicar no botão
   - Verificar que href é `/cadastro` (bug confirmado)

2. **Bug 2 - RPC Error Test**: Simular RPC não existente ou retornando erro (falhará no código não corrigido)
   - Mock Supabase RPC retornando erro `{code: '42883'}`
   - Chamar `addToCart`
   - Verificar que toast genérico é exibido (bug confirmado)

3. **Bug 3 - Loading Infinite Test**: Simular query falhando (falhará no código não corrigido)
   - Mock Supabase query rejeitando com erro
   - Renderizar `OrderHistoryViewer`
   - Aguardar 5 segundos
   - Verificar que `isLoading` ainda é `true` (bug confirmado)

4. **Bug 4 - Submitting Infinite Test**: Simular insert falhando (falhará no código não corrigido)
   - Mock Supabase insert rejeitando com erro RLS
   - Preencher formulário de endereço
   - Clicar em "Salvar"
   - Aguardar 5 segundos
   - Verificar que botão ainda está em loading (bug confirmado)

**Expected Counterexamples**:
- Redirecionamento incorreto para usuários autenticados
- Mensagens de erro genéricas ou ausentes
- Estados de loading que nunca resetam
- Possíveis causas: falta de finally blocks, falta de timeout, falta de verificação de auth

### Fix Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug existe, a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition1(input) DO
  result := handleJoinEliteClick_fixed(input)
  ASSERT result.redirectTarget == "/perfil" OR result.redirectTarget == "/products"
END FOR

FOR ALL input WHERE isBugCondition2(input) DO
  result := addToCart_fixed(input)
  ASSERT result.errorMessage != null AND result.errorMessage.length > 0
END FOR

FOR ALL input WHERE isBugCondition3(input) DO
  result := fetchOrders_fixed(input)
  ASSERT result.isLoading == false AND result.errorDisplayed == true
END FOR

FOR ALL input WHERE isBugCondition4(input) DO
  result := handleCreate_fixed(input)
  ASSERT result.isSubmitting == false AND result.errorDisplayed == true
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug NÃO existe, a função corrigida produz o mesmo resultado que a função original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition1(input) DO
  ASSERT handleJoinEliteClick_original(input) = handleJoinEliteClick_fixed(input)
END FOR

FOR ALL input WHERE NOT isBugCondition2(input) DO
  ASSERT addToCart_original(input) = addToCart_fixed(input)
END FOR

FOR ALL input WHERE NOT isBugCondition3(input) DO
  ASSERT fetchOrders_original(input) = fetchOrders_fixed(input)
END FOR

FOR ALL input WHERE NOT isBugCondition4(input) DO
  ASSERT handleCreate_original(input) = handleCreate_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento permanece inalterado para todas as entradas não-buggy

**Test Plan**: Observar comportamento no código NÃO CORRIGIDO primeiro para operações não afetadas, depois escrever testes baseados em propriedades capturando esse comportamento.

**Test Cases**:
1. **Preservation Test 1**: Observar que operações de carrinho (update, remove) funcionam corretamente no código não corrigido, depois escrever teste para verificar que continuam após correção
2. **Preservation Test 2**: Observar que edição de endereço funciona corretamente no código não corrigido, depois escrever teste para verificar que continua após correção
3. **Preservation Test 3**: Observar que navegação para outras páginas funciona corretamente no código não corrigido, depois escrever teste para verificar que continua após correção

### Unit Tests

- Testar redirecionamento condicional com diferentes estados de autenticação
- Testar tratamento de erro RPC com diferentes códigos de erro PostgreSQL
- Testar timeout de queries com AbortController
- Testar reset de estados de loading em finally blocks
- Testar mensagens de erro específicas para cada tipo de falha

### Property-Based Tests

- Gerar estados de autenticação aleatórios e verificar redirecionamento correto
- Gerar erros RPC aleatórios e verificar que mensagem apropriada é exibida
- Gerar timeouts aleatórios e verificar que loading sempre reseta
- Testar que operações não afetadas continuam funcionando através de muitos cenários

### Integration Tests

- Testar fluxo completo: usuário autenticado clica em "Juntar-se à Elite" e chega em `/perfil`
- Testar fluxo completo: adicionar ao carrinho com RPC falhando e fallback funcionando
- Testar fluxo completo: carregar histórico com timeout e retry bem-sucedido
- Testar fluxo completo: salvar endereço com erro RLS e mensagem clara ao usuário
