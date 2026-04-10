# Realtime Reconnect Persistent Message Fix - Design

## Overview

O bug ocorre quando o componente `RealtimeStatus` exibe uma mensagem persistente "Reconectando...Sincronização pausada" que não desaparece. O problema está no hook `useCart`, que inicializa `realtimeStatus` como 'disconnected' por padrão e não gerencia adequadamente os diferentes cenários onde a conexão Realtime não é necessária (usuários guest) ou não está disponível (migração em progresso).

A estratégia de correção envolve:
1. Introduzir um estado neutro ('idle') para cenários onde Realtime não é aplicável
2. Definir realtimeStatus como 'idle' para usuários guest
3. Definir realtimeStatus como 'idle' quando migração não está completa
4. Manter 'disconnected' apenas quando há falha real de conexão em usuários autenticados
5. Atualizar o componente RealtimeStatus para ignorar o estado 'idle'

## Glossary

- **Bug_Condition (C)**: A condição que aciona o bug - quando realtimeStatus é 'disconnected' em cenários onde não deveria estar (usuários guest, migração em progresso, ou após falha de subscrição sem necessidade de alerta)
- **Property (P)**: O comportamento desejado - realtimeStatus deve ser 'idle' quando Realtime não é aplicável, 'connected' quando estabelecido, e 'disconnected' apenas temporariamente durante reconexões reais
- **Preservation**: Comportamentos existentes que devem permanecer inalterados - subscrição Realtime para usuários autenticados, reconexão com backoff, filtragem de eventos próprios, polling fallback
- **useCart**: Hook em `apps/web/src/modules/cart/hooks/useCart.ts` que gerencia dados do carrinho e subscrição Realtime
- **RealtimeStatus**: Componente em `apps/web/src/components/cart/RealtimeStatus.tsx` que exibe indicador de status de conexão
- **realtimeStatus**: Estado que rastreia o status da conexão Realtime ('connected' | 'disconnected' | 'idle')
- **migrationStatus**: Estado que indica se a migração do carrinho guest para autenticado está completa

## Bug Details

### Bug Condition

O bug se manifesta quando o hook `useCart` define `realtimeStatus` como 'disconnected' em cenários onde a conexão Realtime não é aplicável ou não deveria acionar alertas ao usuário. Isso resulta em uma mensagem persistente de "Reconectando..." que não desaparece.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CartHookState
  OUTPUT: boolean
  
  RETURN (input.user == null AND input.realtimeStatus == 'disconnected')
         OR (input.user != null AND input.migrationStatus NOT IN ['complete', 'error'] AND input.realtimeStatus == 'disconnected')
         OR (input.user != null AND input.realtimeSubscriptionFailed == true AND input.realtimeStatus == 'disconnected' AND input.showsPersistentMessage == true)
END FUNCTION
```

### Examples

- **Usuário Guest**: Usuário não autenticado navega no site → realtimeStatus é 'disconnected' → mensagem "Reconectando..." aparece após 2 segundos (INCORRETO: deveria ser 'idle' sem mensagem)
- **Migração em Progresso**: Usuário faz login e migração está em andamento → realtimeStatus é 'disconnected' → mensagem "Reconectando..." aparece (INCORRETO: deveria ser 'idle' sem mensagem)
- **Subscrição Falhou**: Usuário autenticado, subscrição Realtime falha permanentemente → realtimeStatus permanece 'disconnected' → mensagem persiste indefinidamente (INCORRETO: deveria usar polling silenciosamente)
- **Reconexão Temporária**: Usuário autenticado perde conexão temporariamente → realtimeStatus é 'disconnected' → mensagem aparece brevemente → reconecta e mensagem desaparece (CORRETO: comportamento esperado)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Subscrição Realtime deve continuar sendo estabelecida para usuários autenticados quando migrationStatus é 'complete' ou 'error'
- Reconexão com backoff exponencial deve continuar funcionando quando conexão é perdida temporariamente
- Filtragem de eventos próprios (client_id) deve continuar prevenindo loops
- Polling fallback deve continuar sendo ativado quando Realtime falha
- Lógica de cálculo do carrinho (totalItems, subtotal) deve permanecer inalterada
- Comportamento de loading durante migração deve permanecer inalterado

**Scope:**
Todas as entradas que NÃO envolvem os três cenários do bug (usuário guest, migração em progresso, falha permanente de subscrição) devem ser completamente inalteradas. Isso inclui:
- Usuários autenticados com Realtime funcionando normalmente
- Reconexões temporárias durante problemas de rede
- Sincronização de eventos entre dispositivos
- Migração de carrinho guest para autenticado

## Hypothesized Root Cause

Baseado na descrição do bug, as causas mais prováveis são:

1. **Inicialização Inadequada do Estado**: O hook inicializa `realtimeStatus` como 'disconnected' por padrão, sem considerar que este estado aciona alertas ao usuário
   - Não há diferenciação entre "não aplicável" e "desconectado"
   - Estado inicial deveria ser 'idle' ou outro valor neutro

2. **Falta de Gerenciamento de Estado para Usuários Guest**: O useEffect que gerencia subscrição Realtime retorna early para usuários guest, mas não define realtimeStatus adequadamente
   - realtimeStatus permanece 'disconnected' para usuários guest
   - Deveria ser definido como 'idle' quando user é null

3. **Falta de Gerenciamento de Estado Durante Migração**: Quando migrationStatus não é 'complete' ou 'error', o useEffect retorna early mas não atualiza realtimeStatus
   - realtimeStatus permanece 'disconnected' durante migração
   - Deveria ser definido como 'idle' durante este período

4. **Ausência de Estado para Falha Permanente**: Quando subscrição Realtime falha permanentemente e polling é ativado, não há estado que indique "funcionando com fallback"
   - realtimeStatus permanece 'disconnected' indefinidamente
   - Deveria usar 'idle' ou outro estado que não acione alertas

## Correctness Properties

Property 1: Bug Condition - Realtime Status Adequado

_For any_ estado do hook useCart onde o usuário é guest, ou a migração não está completa, ou a subscrição Realtime falhou permanentemente, o hook corrigido SHALL definir realtimeStatus como 'idle' (ou outro estado neutro) que NÃO aciona a exibição da mensagem persistente de reconexão.

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

Property 2: Preservation - Comportamento de Realtime para Usuários Autenticados

_For any_ estado do hook useCart onde o usuário está autenticado, a migração está completa, e a subscrição Realtime está funcionando ou reconectando temporariamente, o hook corrigido SHALL produzir exatamente o mesmo comportamento do hook original, preservando subscrição Realtime, reconexão com backoff, filtragem de eventos, e polling fallback.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File**: `apps/web/src/modules/cart/hooks/useCart.ts`

**Function**: `useCart`

**Specific Changes**:
1. **Atualizar Tipo do Estado**: Expandir tipo de realtimeStatus para incluir 'idle'
   - Mudar de `'connected' | 'disconnected'` para `'connected' | 'disconnected' | 'idle'`
   - Atualizar inicialização de `useState` para usar 'idle' como padrão

2. **Definir Estado para Usuários Guest**: No início do useEffect de subscrição Realtime
   - Adicionar `setRealtimeStatus('idle')` quando `!user` antes do return
   - Garantir que usuários guest nunca tenham status 'disconnected'

3. **Definir Estado Durante Migração**: No início do useEffect de subscrição Realtime
   - Adicionar `setRealtimeStatus('idle')` quando migrationStatus não é 'complete' ou 'error' antes do return
   - Garantir que período de migração não acione alertas

4. **Gerenciar Estado de Polling Fallback**: Na função `startPolling`
   - Quando polling é iniciado após falha de Realtime, definir `setRealtimeStatus('idle')`
   - Indicar que sistema está funcionando com fallback sem alarmar usuário

5. **Atualizar Componente RealtimeStatus**: No arquivo `apps/web/src/components/cart/RealtimeStatus.tsx`
   - Modificar condição para exibir mensagem apenas quando `realtimeStatus === 'disconnected'`
   - Estado 'idle' não deve acionar nenhuma mensagem

**File**: `apps/web/src/components/cart/RealtimeStatus.tsx`

**Component**: `RealtimeStatus` e `ConnectionIndicator`

**Specific Changes**:
1. **Atualizar Lógica de Exibição**: Garantir que apenas 'disconnected' aciona mensagem
   - Estado 'idle' deve ser tratado como "sem necessidade de indicador"
   - Pode opcionalmente não renderizar nada para 'idle'

2. **Atualizar ConnectionIndicator**: Adicionar caso para 'idle'
   - Pode retornar null ou um indicador neutro
   - Não deve mostrar "Offline" para 'idle'

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de duas fases: primeiro, demonstrar o bug no código não corrigido através de testes exploratórios, depois verificar que a correção funciona corretamente e preserva comportamentos existentes.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: Escrever testes que simulam os três cenários do bug (usuário guest, migração em progresso, falha de subscrição) e verificam que realtimeStatus é 'disconnected' e a mensagem persiste. Executar estes testes no código NÃO CORRIGIDO para observar falhas e entender a causa raiz.

**Test Cases**:
1. **Guest User Test**: Renderizar useCart sem usuário autenticado → verificar que realtimeStatus é 'disconnected' → aguardar 2 segundos → verificar que mensagem aparece (vai falhar no código não corrigido)
2. **Migration In Progress Test**: Renderizar useCart com usuário autenticado mas migrationStatus 'in_progress' → verificar que realtimeStatus é 'disconnected' → verificar que mensagem aparece (vai falhar no código não corrigido)
3. **Subscription Failed Test**: Simular falha de subscrição Realtime → verificar que realtimeStatus permanece 'disconnected' → verificar que mensagem persiste (vai falhar no código não corrigido)
4. **Temporary Disconnection Test**: Simular perda temporária de conexão → verificar que realtimeStatus é 'disconnected' → simular reconexão → verificar que mensagem desaparece (pode passar no código não corrigido - comportamento correto)

**Expected Counterexamples**:
- realtimeStatus é 'disconnected' quando deveria ser 'idle' para usuários guest
- realtimeStatus é 'disconnected' quando deveria ser 'idle' durante migração
- realtimeStatus permanece 'disconnected' indefinidamente após falha de subscrição
- Possíveis causas: inicialização inadequada, falta de gerenciamento de estado para cenários não-aplicáveis

### Fix Checking

**Goal**: Verificar que para todas as entradas onde a condição do bug é verdadeira, o hook corrigido produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := useCart_fixed(input)
  ASSERT (input.user == null IMPLIES result.realtimeStatus == 'idle')
         AND (input.migrationStatus NOT IN ['complete', 'error'] IMPLIES result.realtimeStatus == 'idle')
         AND (input.realtimeSubscriptionFailed == true IMPLIES result.realtimeStatus == 'idle' AND NOT result.showsPersistentMessage)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas as entradas onde a condição do bug NÃO é verdadeira, o hook corrigido produz o mesmo resultado que o hook original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT useCart_original(input).behavior == useCart_fixed(input).behavior
END FOR
```

**Testing Approach**: Testes baseados em propriedades são recomendados para verificação de preservação porque:
- Geram muitos casos de teste automaticamente através do domínio de entrada
- Capturam casos extremos que testes unitários manuais podem perder
- Fornecem garantias fortes de que o comportamento permanece inalterado para todas as entradas não-bugadas

**Test Plan**: Observar comportamento no código NÃO CORRIGIDO primeiro para usuários autenticados com Realtime funcionando, depois escrever testes baseados em propriedades capturando esse comportamento.

**Test Cases**:
1. **Authenticated User with Realtime**: Observar que usuário autenticado com migração completa estabelece subscrição Realtime no código não corrigido, depois escrever teste para verificar que isso continua após correção
2. **Reconnection Behavior**: Observar que reconexão com backoff funciona no código não corrigido, depois escrever teste para verificar que isso continua após correção
3. **Event Filtering**: Observar que eventos com client_id próprio são filtrados no código não corrigido, depois escrever teste para verificar que isso continua após correção
4. **Polling Fallback**: Observar que polling é ativado quando Realtime falha no código não corrigido, depois escrever teste para verificar que isso continua após correção

### Unit Tests

- Testar inicialização de realtimeStatus como 'idle' por padrão
- Testar que realtimeStatus é 'idle' para usuários guest
- Testar que realtimeStatus é 'idle' durante migração
- Testar que realtimeStatus muda para 'connected' quando subscrição é estabelecida
- Testar que realtimeStatus muda para 'disconnected' temporariamente durante reconexão
- Testar que realtimeStatus volta para 'idle' quando polling fallback é ativado
- Testar que componente RealtimeStatus não exibe mensagem para estado 'idle'
- Testar que componente RealtimeStatus exibe mensagem apenas para 'disconnected'

### Property-Based Tests

- Gerar estados aleatórios de usuário (guest vs autenticado) e verificar que realtimeStatus é apropriado
- Gerar estados aleatórios de migração e verificar que realtimeStatus não aciona alertas durante migração
- Gerar cenários aleatórios de falha de subscrição e verificar que polling fallback funciona sem alertas persistentes
- Testar que comportamento de Realtime é preservado para usuários autenticados através de muitos cenários

### Integration Tests

- Testar fluxo completo: usuário guest → adiciona item ao carrinho → faz login → migração completa → Realtime estabelecido → sem mensagens persistentes
- Testar fluxo de reconexão: usuário autenticado → perde conexão → mensagem aparece → reconecta → mensagem desaparece
- Testar fluxo de fallback: usuário autenticado → subscrição falha → polling ativado → sem mensagem persistente → dados sincronizam via polling
