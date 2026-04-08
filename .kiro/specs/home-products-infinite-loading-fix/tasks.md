# Plano de Implementação

- [ ] 1. Escrever teste de exploração da condição de bug
  - **Property 1: Bug Condition** - Query Timeout na Home Page
  - **CRÍTICO**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará o fix quando passar após a implementação
  - **OBJETIVO**: Surfacear contraexemplos que demonstram o bug
  - **Abordagem PBT Escopo**: Para bugs determinísticos, escopar a propriedade ao caso concreto de falha para garantir reprodutibilidade
  - Testar que `useProducts({ limit: 4, sortBy: 'latest' })` na home page resolve ou rejeita em até 10 segundos
  - Implementar teste que simula a query específica da home page
  - Verificar que a promise não fica travada indefinidamente (da especificação Bug Condition no design)
  - Executar no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados para entender a causa raiz
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Escrever testes de preservação de propriedades (ANTES de implementar o fix)
  - **Property 2: Preservation** - Funcionalidade de Outras Páginas
  - **IMPORTANTE**: Seguir metodologia observation-first
  - Observar comportamento no código NÃO CORRIGIDO para entradas não-buggy
  - Escrever testes baseados em propriedades capturando padrões de comportamento observados dos Preservation Requirements
  - Property-based testing gera muitos casos de teste para garantias mais fortes
  - Executar testes no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (isso confirma o comportamento baseline a preservar)
  - Marcar tarefa como completa quando os testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix para loading infinito de produtos na home page

  - [x] 3.1 Criar migration para habilitar acesso público à tabela products
    - Criar arquivo `supabase/migrations/20260407000001_enable_products_public_access.sql`
    - Habilitar RLS na tabela `products` com `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`
    - Criar policy `products_select_public` permitindo `SELECT` para todos onde `deleted_at IS NULL`
    - Documentar que policies de INSERT/UPDATE/DELETE para admin devem ser adicionadas futuramente
    - _Bug_Condition: isBugCondition(input) onde input.page = '/' AND input.filters = { limit: 4, sortBy: 'latest' } AND queryState.isLoading = true AND elapsedTime > 10 segundos_
    - _Expected_Behavior: Query deve resolver com dados ou rejeitar com erro tratável em até 10 segundos (Property 1 do design)_
    - _Preservation: Outras queries que não são useProducts({ limit: 4, sortBy: 'latest' }) na home devem continuar funcionando (Property 2 do design)_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.2 Adicionar timeout e network mode no QueryProvider
    - Editar `apps/web/src/lib/react-query/QueryProvider.tsx`
    - Adicionar `timeout: 10000` (10 segundos) nas `defaultOptions.queries.meta`
    - Adicionar `networkMode: 'offlineFirst'` para melhor handling de falhas de rede
    - Adicionar `retryDelay: 1000` para evitar retry imediato
    - _Bug_Condition: isBugCondition(input) do design_
    - _Expected_Behavior: expectedBehavior(result) do design_
    - _Preservation: Preservation Requirements do design_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.3 Adicionar timeout wrapper e error handling em productService
    - Editar `apps/web/src/modules/products/services/productService.ts`
    - Envolver query do Supabase com `Promise.race()` para forçar timeout de 10 segundos
    - Adicionar verificação explícita para silent failure (data null mas error null)
    - Adicionar logging detalhado com `console.error()` para debugging
    - Aplicar mesmas mudanças em `getProducts` e `getProductsWithSearch`
    - _Bug_Condition: isBugCondition(input) do design_
    - _Expected_Behavior: expectedBehavior(result) do design_
    - _Preservation: Preservation Requirements do design_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.4 Adicionar error state display na home page
    - Editar `apps/web/src/app/page.tsx`
    - Adicionar `error` no destructuring do `useProducts`
    - Adicionar bloco condicional para exibir mensagem de erro amigável quando `error` não é undefined
    - Adicionar botão "Tentar Novamente" que recarrega a página
    - Adicionar logging de erro no console para debugging
    - _Bug_Condition: isBugCondition(input) do design_
    - _Expected_Behavior: expectedBehavior(result) do design_
    - _Preservation: Preservation Requirements do design_
    - _Requirements: 2.3, 2.4_

  - [x] 3.5 Verificar que teste de exploração da condição de bug agora passa
    - **Property 1: Expected Behavior** - Query Timeout na Home Page
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 1 - NÃO escrever um novo teste
    - O teste da tarefa 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Executar teste de exploração da condição de bug da etapa 1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que o bug está corrigido)
    - _Requirements: Expected Behavior Properties do design (2.1, 2.2, 2.3, 2.4)_

  - [x] 3.6 Verificar que testes de preservação ainda passam
    - **Property 2: Preservation** - Funcionalidade de Outras Páginas
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 2 - NÃO escrever novos testes
    - Executar testes de preservação de propriedades da etapa 2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após o fix (sem regressões)

- [x] 4. Checkpoint - Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se surgirem dúvidas
