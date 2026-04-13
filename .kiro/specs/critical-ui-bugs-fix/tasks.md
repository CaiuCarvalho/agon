# Implementation Plan

## Bug 1: Redirecionamento Incorreto do Botão "Juntar-se à Elite"

- [x] 1.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Redirecionamento Incorreto para Usuário Autenticado
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Revelar contraexemplos que demonstram que o bug existe
  - **Abordagem PBT Escopo**: Para este bug determinístico, escopar a propriedade ao caso concreto de falha: usuário autenticado clicando no botão
  - Testar que quando `useAuth()` retorna `{ user: { id: 'test-user' } }`, o botão "Juntar-se à Elite" redireciona para `/cadastro` (comportamento buggy)
  - As asserções do teste devem corresponder às Expected Behavior Properties do design: redirecionamento para `/perfil` ou `/products`
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados para entender a causa raiz
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 1.2 Write preservation property tests (ANTES de implementar correção)
  - **Property 2: Preservation** - Navegação para Usuários Não Autenticados
  - **IMPORTANTE**: Seguir metodologia observation-first
  - Observar: Quando `useAuth()` retorna `{ user: null }`, o botão redireciona para `/cadastro` no código não corrigido
  - Observar: Navegação para outras páginas (produtos, carrinho) funciona normalmente no código não corrigido
  - Escrever teste baseado em propriedade: para todos os usuários não autenticados, o redirecionamento deve ser `/cadastro`
  - Escrever teste baseado em propriedade: para todas as outras navegações, o comportamento deve permanecer inalterado
  - Verificar que testes passam no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2_

- [x] 1.3 Fix para redirecionamento baseado em autenticação

  - [x] 1.3.1 Implementar verificação de autenticação no botão
    - Importar hook `useAuth` de `@/hooks/useAuth`
    - Adicionar `const { user } = useAuth()` no componente
    - Alterar href do Link para condicional: `href={user ? "/perfil" : "/cadastro"}`
    - Adicionar comentário explicando a lógica: "Usuários autenticados vão para perfil, não autenticados para cadastro"
    - _Bug_Condition: isBugCondition1(input) onde input.userAuthState == true AND redirectTarget == "/cadastro"_
    - _Expected_Behavior: Quando user existe, redirecionar para /perfil ou /products (req 2.1)_
    - _Preservation: Usuários não autenticados continuam indo para /cadastro (req 3.1, 3.2)_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

  - [x] 1.3.2 Verificar que bug condition exploration test agora passa
    - **Property 1: Expected Behavior** - Redirecionamento Correto para Usuário Autenticado
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 1.1 - NÃO escrever um novo teste
    - O teste da tarefa 1.1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Executar bug condition exploration test do passo 1.1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que bug está corrigido)
    - _Requirements: 2.1, 2.2_

  - [x] 1.3.3 Verificar que preservation tests ainda passam
    - **Property 2: Preservation** - Navegação para Usuários Não Autenticados
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 1.2 - NÃO escrever novos testes
    - Executar preservation property tests do passo 1.2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após correção (sem regressões)

- [x] 1.4 Checkpoint - Garantir que todos os testes do Bug 1 passam
  - Executar todos os testes relacionados ao Bug 1
  - Verificar que não há regressões em outras funcionalidades
  - Perguntar ao usuário se surgirem dúvidas

## Bug 2: Falha Silenciosa ao Adicionar ao Carrinho

- [x] 2.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - RPC Falha Sem Feedback Claro
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Revelar contraexemplos que demonstram que o bug existe
  - **Abordagem PBT Escopo**: Para este bug determinístico, escopar a propriedade aos casos concretos de falha: RPC não existe (código 42883), RPC retorna erro, timeout
  - Testar que quando `add_to_cart_atomic` RPC não existe (erro PostgreSQL 42883), o sistema exibe mensagem genérica ou nenhuma mensagem
  - Testar que quando RPC retorna `{success: false, error: "Produto não encontrado"}`, o erro não é exibido ao usuário
  - Testar que quando RPC falha por timeout, não há retry e usuário não recebe feedback
  - As asserções do teste devem corresponder às Expected Behavior Properties do design: mensagens de erro específicas e claras
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados para entender a causa raiz
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.3, 1.4, 2.3, 2.4, 2.5_

- [x] 2.2 Write preservation property tests (ANTES de implementar correção)
  - **Property 2: Preservation** - Operações de Carrinho Existentes
  - **IMPORTANTE**: Seguir metodologia observation-first
  - Observar: `updateQuantity` funciona com debounce de 500ms no código não corrigido
  - Observar: `removeItem` funciona com update otimista e rollback em caso de erro no código não corrigido
  - Observar: Carrinho guest usa localStorage corretamente no código não corrigido
  - Escrever teste baseado em propriedade: para todas as operações de carrinho que NÃO são "add", o comportamento deve permanecer inalterado
  - Verificar que testes passam no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 2.3 Fix para tratamento robusto de erro RPC

  - [x] 2.3.1 Implementar detecção de erro RPC não existente
    - No arquivo `apps/web/src/modules/cart/services/cartService.ts`, função `addToCart`
    - Adicionar verificação de código de erro PostgreSQL 42883 (function does not exist)
    - Exibir toast específico: "Função de carrinho não configurada. Contate o suporte."
    - Adicionar verificação de timeout: se `error.message?.includes('timeout')`, exibir "Tempo esgotado. Tente novamente."
    - Para outros erros, exibir mensagem específica: `Erro ao adicionar: ${error.message}`
    - _Bug_Condition: isBugCondition2(input) onde rpcName == "add_to_cart_atomic" AND (rpcExists == false OR rpcError != null) AND userFeedback == null_
    - _Expected_Behavior: Exibir mensagem de erro específica para cada tipo de falha (req 2.3, 2.4, 2.5)_
    - _Preservation: Operações de update, remove e clear continuam funcionando (req 3.3, 3.4, 3.5)_
    - _Requirements: 1.3, 1.4, 2.3, 2.4, 2.5, 3.3, 3.4, 3.5_

  - [x] 2.3.2 Implementar validação de resposta RPC
    - Verificar estrutura da resposta: se `!data.success`, extrair `data.error`
    - Exibir toast com erro específico: `toast.error(data.error || 'Erro desconhecido')`
    - Lançar erro para interromper fluxo: `throw new Error(data.error)`
    - _Requirements: 2.3, 2.4_

  - [x] 2.3.3 Implementar fallback para insert direto
    - Adicionar bloco try-catch ao redor da chamada RPC
    - No catch, tentar insert direto na tabela `cart_items`
    - Se insert direto também falhar, lançar erro final
    - Adicionar comentário: "Fallback: se RPC falhar, tentar insert manual"
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 2.3.4 Verificar que bug condition exploration test agora passa
    - **Property 1: Expected Behavior** - Mensagens de Erro Específicas para RPC
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 2.1 - NÃO escrever um novo teste
    - O teste da tarefa 2.1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Executar bug condition exploration test do passo 2.1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que bug está corrigido)
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 2.3.5 Verificar que preservation tests ainda passam
    - **Property 2: Preservation** - Operações de Carrinho Existentes
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 2.2 - NÃO escrever novos testes
    - Executar preservation property tests do passo 2.2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após correção (sem regressões)

- [x] 2.4 Checkpoint - Garantir que todos os testes do Bug 2 passam
  - Executar todos os testes relacionados ao Bug 2
  - Verificar que não há regressões em outras funcionalidades
  - Perguntar ao usuário se surgirem dúvidas

## Bug 3: Loading Infinito no Histórico de Pedidos

- [x] 3.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Loading Infinito em Query Falhada
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Revelar contraexemplos que demonstram que o bug existe
  - **Abordagem PBT Escopo**: Para este bug determinístico, escopar a propriedade aos casos concretos de falha: query falha por RLS, timeout, erro de rede
  - Testar que quando query do Supabase falha (rejeita com erro), `isLoading` permanece `true` após 5 segundos
  - Testar que quando query falha por timeout, não há mensagem de erro exibida
  - Testar que quando query retorna array vazio, UI não exibe estado vazio apropriado
  - As asserções do teste devem corresponder às Expected Behavior Properties do design: loading reseta e mensagem de erro é exibida
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados para entender a causa raiz
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.5, 1.6, 2.6, 2.7, 2.8_

- [x] 3.2 Write preservation property tests (ANTES de implementar correção)
  - **Property 2: Preservation** - Outras Operações de Pedidos
  - **IMPORTANTE**: Seguir metodologia observation-first
  - Observar: Criação de pedido salva na tabela `orders` com status correto no código não corrigido
  - Observar: Visualização de detalhes de pedido específico exibe informações completas no código não corrigido
  - Escrever teste baseado em propriedade: para todas as operações de pedidos que NÃO são "fetch history", o comportamento deve permanecer inalterado
  - Verificar que testes passam no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.9, 3.10_

- [x] 3.3 Fix para timeout e finally block no histórico

  - [x] 3.3.1 Implementar AbortController com timeout de 10 segundos
    - No arquivo `apps/web/src/components/profile/OrderHistoryViewer.tsx`, função `fetchOrders`
    - Criar `const abortController = new AbortController()`
    - Criar `const timeoutId = setTimeout(() => abortController.abort(), 10000)`
    - Adicionar `.abortSignal(abortController.signal)` à query do Supabase
    - Adicionar `clearTimeout(timeoutId)` após query bem-sucedida
    - _Bug_Condition: isBugCondition3(input) onde queryState == "failed" AND errorOccurred == true AND loadingState == true AND timeElapsed > 5000ms_
    - _Expected_Behavior: Query completa em até 10 segundos ou aborta com mensagem clara (req 2.6, 2.7)_
    - _Preservation: Criação e visualização de pedidos continuam funcionando (req 3.9, 3.10)_
    - _Requirements: 1.5, 1.6, 2.6, 2.7, 2.8, 3.9, 3.10_

  - [x] 3.3.2 Adicionar finally block para resetar loading
    - Mover `setIsLoading(false)` do try block para finally block
    - Garantir que loading sempre reseta, independente de sucesso ou erro
    - Adicionar comentário: "CRITICAL: Always reset loading state"
    - _Requirements: 2.6, 2.7_

  - [x] 3.3.3 Melhorar mensagens de erro específicas
    - No catch block, verificar `error.name === 'AbortError'` para timeout
    - Exibir toast: "Tempo esgotado ao carregar pedidos. Tente novamente."
    - Verificar `error.code === 'PGRST116'` para erro RLS
    - Exibir toast: "Sem permissão para acessar pedidos"
    - Para outros erros, exibir: "Erro ao carregar histórico de pedidos"
    - _Requirements: 2.7_

  - [x] 3.3.4 Implementar estado vazio apropriado
    - Verificar se `data` é array vazio após query bem-sucedida
    - Exibir mensagem: "Nenhum pedido encontrado"
    - Adicionar sugestão: "Faça seu primeiro pedido na loja"
    - _Requirements: 2.8_

  - [x] 3.3.5 Verificar que bug condition exploration test agora passa
    - **Property 1: Expected Behavior** - Loading Reseta e Erro é Exibido
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 3.1 - NÃO escrever um novo teste
    - O teste da tarefa 3.1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Executar bug condition exploration test do passo 3.1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que bug está corrigido)
    - _Requirements: 2.6, 2.7, 2.8_

  - [x] 3.3.6 Verificar que preservation tests ainda passam
    - **Property 2: Preservation** - Outras Operações de Pedidos
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 3.2 - NÃO escrever novos testes
    - Executar preservation property tests do passo 3.2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após correção (sem regressões)

- [x] 3.4 Checkpoint - Garantir que todos os testes do Bug 3 passam
  - Executar todos os testes relacionados ao Bug 3
  - Verificar que não há regressões em outras funcionalidades
  - Perguntar ao usuário se surgirem dúvidas

## Bug 4: Loading Infinito ao Adicionar Endereço

- [x] 4.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Loading Infinito em Insert Falhado
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Revelar contraexemplos que demonstram que o bug existe
  - **Abordagem PBT Escopo**: Para este bug determinístico, escopar a propriedade aos casos concretos de falha: insert falha por RLS, constraint, timeout
  - Testar que quando insert do Supabase falha (rejeita com erro RLS), `isSubmitting` permanece `true` após 5 segundos
  - Testar que quando insert falha por constraint (limite de 5 endereços), erro não é exibido claramente
  - Testar que quando insert falha por timeout, não há retry e botão fica travado
  - As asserções do teste devem corresponder às Expected Behavior Properties do design: submitting reseta e mensagem de erro é exibida
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados para entender a causa raiz
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.7, 1.8, 2.9, 2.10, 2.11_

- [x] 4.2 Write preservation property tests (ANTES de implementar correção)
  - **Property 2: Preservation** - Outras Operações de Endereço
  - **IMPORTANTE**: Seguir metodologia observation-first
  - Observar: Edição de endereço existente atualiza corretamente no código não corrigido
  - Observar: Definir endereço como padrão desmarca o anterior e marca o novo no código não corrigido
  - Observar: Visualização de dados pessoais exibe informações corretas no código não corrigido
  - Escrever teste baseado em propriedade: para todas as operações de endereço que NÃO são "create", o comportamento deve permanecer inalterado
  - Verificar que testes passam no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.6, 3.7, 3.8_

- [x] 4.3 Fix para timeout e finally block no endereço

  - [x] 4.3.1 Implementar AbortController com timeout de 10 segundos
    - No arquivo `apps/web/src/components/profile/AddressManager.tsx`, função `handleCreate`
    - Criar `const abortController = new AbortController()`
    - Criar `const timeoutId = setTimeout(() => abortController.abort(), 10000)`
    - Adicionar `.abortSignal(abortController.signal)` ao insert do Supabase
    - Adicionar `clearTimeout(timeoutId)` após insert bem-sucedido
    - _Bug_Condition: isBugCondition4(input) onde insertState == "failed" AND errorOccurred == true AND submittingState == true AND timeElapsed > 5000ms_
    - _Expected_Behavior: Insert completa em até 10 segundos ou aborta com mensagem clara (req 2.9, 2.10, 2.11)_
    - _Preservation: Edição e exclusão de endereços continuam funcionando (req 3.6, 3.7, 3.8)_
    - _Requirements: 1.7, 1.8, 2.9, 2.10, 2.11, 3.6, 3.7, 3.8_

  - [x] 4.3.2 Adicionar finally block para resetar submitting
    - Mover `setIsSubmitting(false)` do try block para finally block
    - Garantir que submitting sempre reseta, independente de sucesso ou erro
    - Adicionar comentário: "CRITICAL: Always reset submitting state"
    - _Requirements: 2.9, 2.10_

  - [x] 4.3.3 Melhorar mensagens de erro específicas
    - No catch block, verificar `error.name === 'AbortError'` para timeout
    - Exibir toast: "Tempo esgotado ao salvar endereço. Tente novamente."
    - Verificar `error.code === '23505'` para unique constraint
    - Exibir toast: "Você já possui um endereço padrão"
    - Verificar `error.code === 'PGRST116'` para erro RLS
    - Exibir toast: "Sem permissão para adicionar endereço. Faça login novamente."
    - Para outros erros, exibir: "Erro ao adicionar endereço"
    - _Requirements: 2.10_

  - [x] 4.3.4 Aplicar mesmo fix em handleUpdate
    - Replicar lógica de timeout e finally block na função `handleUpdate`
    - Garantir consistência entre create e update
    - Adicionar comentário: "Same timeout and finally logic as handleCreate"
    - _Requirements: 2.9, 2.10, 2.11_

  - [x] 4.3.5 Verificar que bug condition exploration test agora passa
    - **Property 1: Expected Behavior** - Submitting Reseta e Erro é Exibido
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 4.1 - NÃO escrever um novo teste
    - O teste da tarefa 4.1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Executar bug condition exploration test do passo 4.1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que bug está corrigido)
    - _Requirements: 2.9, 2.10, 2.11_

  - [x] 4.3.6 Verificar que preservation tests ainda passam
    - **Property 2: Preservation** - Outras Operações de Endereço
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 4.2 - NÃO escrever novos testes
    - Executar preservation property tests do passo 4.2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após correção (sem regressões)

- [x] 4.4 Checkpoint - Garantir que todos os testes do Bug 4 passam
  - Executar todos os testes relacionados ao Bug 4
  - Verificar que não há regressões em outras funcionalidades
  - Perguntar ao usuário se surgirem dúvidas

## Final Checkpoint

- [x] 5. Checkpoint Final - Garantir que todos os testes passam
  - Executar suite completa de testes para os 4 bugs
  - Verificar que não há regressões em nenhuma funcionalidade
  - Confirmar que todos os 4 bugs foram corrigidos com sucesso
  - Perguntar ao usuário se surgirem dúvidas ou se há algo mais a fazer
